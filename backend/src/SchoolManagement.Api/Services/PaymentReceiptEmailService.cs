using System.Text.Encodings.Web;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Services;

public sealed class PaymentReceiptEmailService
{
    private readonly SchoolManagementDbContext db;
    private readonly IDataProtector protector;
    private readonly ILogger<PaymentReceiptEmailService> logger;

    public PaymentReceiptEmailService(SchoolManagementDbContext db, IDataProtectionProvider provider, ILogger<PaymentReceiptEmailService> logger)
    {
        this.db = db;
        protector = provider.CreateProtector("KSHS.SMIS.InstitutionEmailSettings.v1");
        this.logger = logger;
    }

    public async Task<bool> SendReceiptAsync(Guid paymentId, CancellationToken ct)
    {
        var payment = await db.Payments.SingleOrDefaultAsync(x => x.Id == paymentId, ct);
        if (payment is null || payment.ReceiptEmailSentAt.HasValue) return payment?.ReceiptEmailSentAt.HasValue == true;

        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == payment.StudentId, ct);
        var school = await db.InstitutionSettings.AsNoTracking().SingleOrDefaultAsync(x => x.IsActive, ct);
        if (student is null || string.IsNullOrWhiteSpace(student.Email) || school is null || !school.EmailEnabled
            || string.IsNullOrWhiteSpace(school.EmailSmtpHost) || string.IsNullOrWhiteSpace(school.EmailSmtpUsername)
            || string.IsNullOrWhiteSpace(school.EmailSmtpPasswordProtected)
            || string.IsNullOrWhiteSpace(school.EmailFromAddress ?? school.Email))
            return false;

        try
        {
            var balance = await db.StudentInvoices.AsNoTracking()
                .Where(x => x.StudentId == student.Id)
                .Select(x => x.Amount - x.DiscountAmount - x.PaidAmount)
                .SumAsync(ct);
            var fullName = string.Join(" ", new[] { student.FirstName, student.OtherNames, student.LastName }.Where(x => !string.IsNullOrWhiteSpace(x)));
            var channel = payment.SourceChannel ?? payment.PaymentMethod;
            var transactionId = payment.ProviderTransactionId ?? payment.Reference ?? payment.ReceiptNumber;
            var html = BuildHtml(school.InstitutionName, school.Email ?? school.EmailFromAddress ?? string.Empty, fullName,
                student.StudentNumber, payment.ReceiptNumber, transactionId, payment.Amount, balance, channel, payment.PaidAt);
            var pdf = BuildPdf(school.InstitutionName, fullName, student.StudentNumber, payment.ReceiptNumber,
                transactionId, payment.Amount, balance, channel, payment.PaidAt);

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(school.EmailFromName ?? school.InstitutionName, school.EmailFromAddress ?? school.Email));
            message.To.Add(MailboxAddress.Parse(student.Email));
            message.Subject = $"Official fee receipt: {payment.Currency} {payment.Amount:N0} [Ref: {payment.ReceiptNumber}]";
            var body = new BodyBuilder
            {
                HtmlBody = html,
                TextBody = $"Dear Student/Parent, payment {payment.ReceiptNumber} of {payment.Currency} {payment.Amount:N0} has been credited to {school.InstitutionName}. Remaining balance: {payment.Currency} {balance:N0}."
            };
            body.Attachments.Add($"Receipt-{payment.ReceiptNumber}.pdf", pdf, ContentType.Parse("application/pdf"));
            message.Body = body.ToMessageBody();

            using var smtp = new SmtpClient();
            var secureMode = school.EmailSmtpSecureMode switch
            {
                "SslOnConnect" => SecureSocketOptions.SslOnConnect,
                "StartTlsWhenAvailable" => SecureSocketOptions.StartTlsWhenAvailable,
                _ => SecureSocketOptions.StartTls
            };
            await smtp.ConnectAsync(school.EmailSmtpHost, school.EmailSmtpPort ?? 587, secureMode, ct);
            await smtp.AuthenticateAsync(school.EmailSmtpUsername, protector.Unprotect(school.EmailSmtpPasswordProtected), ct);
            await smtp.SendAsync(message, ct);
            await smtp.DisconnectAsync(true, ct);

            payment.ReceiptEmailSentAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Payment receipt email sent. PaymentId={PaymentId}; StudentId={StudentId}", payment.Id, student.Id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment receipt email failed. PaymentId={PaymentId}", paymentId);
            return false;
        }
    }

    private static string Encode(string? value) => HtmlEncoder.Default.Encode(value ?? string.Empty);

    private static string BuildHtml(string school, string schoolEmail, string student, string regNo, string receipt,
        string transaction, decimal amount, decimal balance, string channel, DateTimeOffset paidAt)
    {
        var balanceColor = balance <= 0 ? "#047857" : "#b91c1c";
        return $"""
        <!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:24px;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
        <main style="max-width:620px;margin:auto;background:#fff;border:1px solid #e2e8f0;padding:28px">
        <header style="text-align:center;border-bottom:2px solid #0f172a;padding-bottom:16px"><h1 style="font-size:20px;margin:0;text-transform:uppercase">{Encode(school)}</h1><p>Official Fee Payment Receipt</p></header>
        <p style="text-align:center;color:#047857;font-weight:bold">PAYMENT VERIFIED AND LOGGED</p>
        <p>Dear Student / Parent,</p><p>This message confirms that the following payment has been credited to the student's institutional ledger via <strong>{Encode(channel)}</strong>.</p>
        <section style="background:#f8fafc;border:1px dashed #cbd5e1;padding:18px;text-align:center"><small>AMOUNT RECEIVED</small><h2 style="margin:6px;color:#059669">UGX {amount:N0}</h2></section>
        <table style="width:100%;border-collapse:collapse;margin-top:18px"><tr><td>Student name</td><td><strong>{Encode(student)}</strong></td></tr><tr><td>Registration number</td><td>{Encode(regNo)}</td></tr><tr><td>Receipt number</td><td>{Encode(receipt)}</td></tr><tr><td>Transaction reference</td><td>{Encode(transaction)}</td></tr><tr><td>Payment date</td><td>{paidAt.ToLocalTime():dd MMM yyyy HH:mm}</td></tr><tr><td style="padding-top:12px">Remaining balance</td><td style="padding-top:12px;color:{balanceColor};font-weight:bold">UGX {balance:N0} {(balance <= 0 ? "(CLEARED)" : string.Empty)}</td></tr></table>
        <footer style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;color:#64748b;font-size:12px">Automated receipt from the SMIS Finance Engine.<br>Queries? Contact {Encode(schoolEmail)}</footer>
        </main></body></html>
        """;
    }

    private static byte[] BuildPdf(string school, string student, string regNo, string receipt, string transaction,
        decimal amount, decimal balance, string channel, DateTimeOffset paidAt)
    {
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(42);
            page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Helvetica"));
            page.Content().Column(column =>
            {
                column.Spacing(12);
                column.Item().AlignCenter().Text(school.ToUpperInvariant()).Bold().FontSize(18);
                column.Item().AlignCenter().Text("OFFICIAL FEE PAYMENT RECEIPT").SemiBold().FontSize(13);
                column.Item().PaddingVertical(8).LineHorizontal(1);
                column.Item().Text("PAYMENT VERIFIED AND LOGGED").Bold().FontColor(Colors.Green.Darken2);
                column.Item().Text($"Student: {student}");
                column.Item().Text($"Registration number: {regNo}");
                column.Item().Text($"Receipt number: {receipt}");
                column.Item().Text($"Transaction reference: {transaction}");
                column.Item().Text($"Payment channel: {channel}");
                column.Item().Text($"Payment date: {paidAt.ToLocalTime():dd MMM yyyy HH:mm}");
                column.Item().PaddingTop(12).Text($"AMOUNT RECEIVED: UGX {amount:N0}").Bold().FontSize(16);
                column.Item().Text($"REMAINING BALANCE: UGX {balance:N0} {(balance <= 0 ? "(CLEARED)" : string.Empty)}").Bold();
                column.Item().PaddingTop(24).LineHorizontal(1);
                column.Item().AlignCenter().Text("This receipt was generated by the SMIS Finance Engine.").FontSize(9);
            });
        })).GeneratePdf();
    }
}
