using System.Net.Http.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Services;

public sealed class PaymentReceiptEmailService(
    SchoolManagementDbContext db,
    IDataProtectionProvider provider,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<PaymentReceiptEmailService> logger)
{
    private readonly IDataProtector protector = provider.CreateProtector("KSHS.SMIS.InstitutionEmailSettings.v1");
    private readonly HttpClient emailClient = httpClientFactory.CreateClient("InstitutionalEmailService");

    public async Task<int> ProcessPendingReceiptsAsync(CancellationToken ct)
    {
        var emailEnabled = await db.InstitutionSettings.AsNoTracking().AnyAsync(x => x.IsActive && x.EmailEnabled, ct);
        if (!emailEnabled) return 0;

        var retryBefore = DateTimeOffset.UtcNow.AddMinutes(-5);
        var pendingIds = await db.Payments.AsNoTracking()
            .Where(x => x.ReceiptEmailRequestedAt != null
                && x.ReceiptEmailSentAt == null
                && (x.ReceiptEmailLastAttemptAt == null || x.ReceiptEmailLastAttemptAt < retryBefore))
            .OrderBy(x => x.ReceiptEmailRequestedAt)
            .Select(x => x.Id)
            .Take(25)
            .ToListAsync(ct);

        var processed = 0;
        foreach (var paymentId in pendingIds)
        {
            ct.ThrowIfCancellationRequested();
            if (await SendReceiptAsync(paymentId, ct)) processed++;
        }
        return processed;
    }

    public async Task<bool> SendReceiptAsync(Guid paymentId, CancellationToken ct)
    {
        var alreadySent = await db.Payments.AsNoTracking()
            .Where(x => x.Id == paymentId)
            .Select(x => x.ReceiptEmailSentAt != null)
            .SingleOrDefaultAsync(ct);
        if (alreadySent) return true;

        var attemptAt = DateTimeOffset.UtcNow;
        var retryBefore = attemptAt.AddMinutes(-5);
        var claimed = await db.Payments
            .Where(x => x.Id == paymentId
                && x.ReceiptEmailRequestedAt != null
                && x.ReceiptEmailSentAt == null
                && (x.ReceiptEmailLastAttemptAt == null || x.ReceiptEmailLastAttemptAt < retryBefore))
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.ReceiptEmailLastAttemptAt, attemptAt), ct);
        if (claimed == 0) return false;

        var payment = await db.Payments.SingleOrDefaultAsync(x => x.Id == paymentId, ct);
        if (payment is null) return false;

        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == payment.StudentId, ct);
        var school = await db.InstitutionSettings.AsNoTracking().SingleOrDefaultAsync(x => x.IsActive, ct);
        if (student is null || school is null || !school.EmailEnabled
            || string.IsNullOrWhiteSpace(school.EmailSmtpHost)
            || string.IsNullOrWhiteSpace(school.EmailSmtpUsername)
            || string.IsNullOrWhiteSpace(school.EmailSmtpPasswordProtected)
            || string.IsNullOrWhiteSpace(school.EmailFromAddress ?? school.Email)
            || string.IsNullOrWhiteSpace(student.Email))
            return false;

        var apiKey = configuration["EmailService:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Length < 32)
        {
            logger.LogError("Institutional email is enabled but EmailService:ApiKey is not configured.");
            return false;
        }

        try
        {
            var invoiceBalance = await db.StudentInvoices.AsNoTracking()
                .Where(x => x.StudentId == student.Id)
                .Select(x => x.Amount - x.DiscountAmount - x.PaidAmount)
                .SumAsync(ct);
            var unappliedCredits = await db.Payments.AsNoTracking()
                .Where(x => x.StudentId == student.Id)
                .Select(x => x.Amount - x.Allocations.Sum(a => a.AllocatedAmount))
                .Where(x => x > 0)
                .SumAsync(ct);
            var balance = Math.Max(0m, invoiceBalance - unappliedCredits);
            var fullName = string.Join(" ", new[] { student.LastName, student.FirstName, student.OtherNames }
                .Where(x => !string.IsNullOrWhiteSpace(x))).ToUpperInvariant();
            var payload = new
            {
                smtp = new
                {
                    host = school.EmailSmtpHost,
                    port = school.EmailSmtpPort ?? 587,
                    secureMode = school.EmailSmtpSecureMode ?? "StartTls",
                    username = school.EmailSmtpUsername,
                    password = protector.Unprotect(school.EmailSmtpPasswordProtected)
                },
                sender = new
                {
                    address = school.EmailFromAddress ?? school.Email!,
                    name = school.EmailFromName ?? school.InstitutionName
                },
                recipient = student.Email,
                institutionName = school.InstitutionName,
                institutionEmail = school.Email ?? school.EmailFromAddress ?? string.Empty,
                receipt = new
                {
                    studentName = fullName,
                    studentNumber = student.StudentNumber,
                    receiptNumber = payment.ReceiptNumber,
                    transactionReference = payment.ProviderTransactionId ?? payment.Reference ?? payment.ReceiptNumber,
                    amount = payment.Amount,
                    currency = payment.Currency,
                    balance = Math.Max(0m, balance),
                    channel = payment.SourceChannel ?? payment.PaymentMethod,
                    paidAt = payment.PaidAt
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "/internal/receipts/send");
            request.Headers.Add("x-smis-email-service-key", apiKey);
            request.Content = JsonContent.Create(payload);
            using var response = await emailClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Email service rejected receipt delivery. PaymentId={PaymentId}; StatusCode={StatusCode}",
                    paymentId, (int)response.StatusCode);
                return false;
            }

            var result = await response.Content.ReadFromJsonAsync<EmailServiceResponse>(cancellationToken: ct);
            if (result?.Sent != true) return false;

            payment.ReceiptEmailSentAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Payment receipt email sent. PaymentId={PaymentId}; StudentId={StudentId}",
                payment.Id, student.Id);
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment receipt email failed. PaymentId={PaymentId}", paymentId);
            return false;
        }
    }

    private sealed record EmailServiceResponse(bool Sent, string? MessageId);
}
