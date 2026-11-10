using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using System.Security.Cryptography;
using System.Text;

namespace SchoolManagement.Application.Finance;

public sealed class SchoolPayService(IFinanceRepository finance, FinanceService financeService) : ISchoolPayService
{
    public async Task<SchoolPaymentNotification> ProcessNotificationAsync(string externalReference, string schoolPayReference, Guid? studentId, Guid? studentInvoiceId, decimal amount, string currency, string? phoneNumber, string? payerName, string? channel, string? rawPayload, CancellationToken cancellationToken, string? providerTransactionId = null, string? providerStatus = null)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) throw new ArgumentException("External reference is required.");
        if (string.IsNullOrWhiteSpace(schoolPayReference)) throw new ArgumentException("SchoolPay reference is required.");
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.");
        if (!string.Equals(providerStatus?.Trim(), "PAID", StringComparison.OrdinalIgnoreCase) && !string.Equals(providerStatus?.Trim(), "Completed", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("SchoolPay transaction is not confirmed as paid/completed.");
        if (string.IsNullOrWhiteSpace(providerTransactionId)) throw new ArgumentException("SchoolPay provider transaction ID is required.");
        if (string.IsNullOrWhiteSpace(channel)) throw new ArgumentException("SchoolPay source channel is required.");

        var normalizedExternalRef = externalReference.Trim();
        var existing = await finance.GetSchoolPaymentNotificationAsync(normalizedExternalRef, cancellationToken);
        if (existing is not null)
        {
            var samePayment = string.Equals(existing.SchoolPayReference, schoolPayReference.Trim(), StringComparison.Ordinal)
                && existing.StudentId == studentId
                && existing.StudentInvoiceId == studentInvoiceId
                && existing.Amount == amount
                && string.Equals(existing.Currency, currency.Trim(), StringComparison.OrdinalIgnoreCase)
                && string.Equals(existing.Channel, channel?.Trim(), StringComparison.OrdinalIgnoreCase)
                && string.Equals(existing.ProviderTransactionId, providerTransactionId?.Trim(), StringComparison.Ordinal)
                && string.Equals(existing.ProviderStatus, providerStatus?.Trim(), StringComparison.OrdinalIgnoreCase);
            if (!samePayment)
                throw new InvalidOperationException("External reference has already been received with different payment details.");
            return existing;
        }

        if (studentInvoiceId.HasValue)
        {
            var invoice = await finance.GetInvoiceAsync(studentInvoiceId.Value, cancellationToken)
                ?? throw new ArgumentException("SchoolPay notification references an unknown invoice.");
            if (studentId.HasValue && studentId.Value != invoice.StudentId)
                throw new InvalidOperationException("SchoolPay student and invoice references do not match.");
            if (!string.Equals(invoice.Currency, currency.Trim(), StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("SchoolPay payment currency does not match the invoice currency.");
            studentId = invoice.StudentId;
        }

        var notification = new SchoolPaymentNotification
        {
            ExternalReference = normalizedExternalRef,
            SchoolPayReference = schoolPayReference.Trim(),
            StudentId = studentId,
            StudentInvoiceId = studentInvoiceId,
            Amount = amount,
            Currency = currency.Trim().ToUpperInvariant(),
            Channel = string.IsNullOrWhiteSpace(channel) ? null : channel.Trim(),
            ProviderTransactionId = providerTransactionId.Trim(),
            ProviderStatus = providerStatus!.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? null : phoneNumber.Trim(),
            PayerName = string.IsNullOrWhiteSpace(payerName) ? null : payerName.Trim(),
            RawPayload = rawPayload,
            Status = "Pending"
        };

        await finance.AddSchoolPaymentNotificationAsync(notification, cancellationToken);

        try
        {

            if (studentInvoiceId.HasValue)
            {
                var receiptNumber = CreateReceiptNumber(normalizedExternalRef);
                await financeService.RecordPaymentAsync(studentInvoiceId.Value, receiptNumber, amount, "SchoolPay", schoolPayReference, cancellationToken, "SchoolPay", channel, providerTransactionId, saveChanges: false);
            }
            else if (studentId.HasValue)
            {
                var receiptNumber = CreateReceiptNumber(normalizedExternalRef);
                await financeService.RecordUnallocatedPaymentAsync(studentId.Value, receiptNumber, amount, "SchoolPay", currency, schoolPayReference, cancellationToken, "SchoolPay", channel, providerTransactionId, saveChanges: false, allocateToOutstandingInvoices: true);
            }
            else
            {
                throw new InvalidOperationException("SchoolPay notification must include either a student ID or a student invoice ID.");
            }

            notification.Status = "Processed";
            notification.ProcessedAt = DateTimeOffset.UtcNow;
            await finance.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Do not retry SaveChanges after a failed transaction; tracked Added entities
            // could otherwise be committed by a second save.
            throw;
        }
        return notification;
    }

    public Task<bool> IsProcessedAsync(string externalReference, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) throw new ArgumentException("External reference is required.");
        return IsProcessedAsyncCore(externalReference.Trim(), cancellationToken);
    }

    public Task<IReadOnlyList<SchoolPaymentNotification>> GetNotificationsAsync(CancellationToken cancellationToken) => finance.GetSchoolPaymentNotificationsAsync(cancellationToken);

    public Task<SchoolPaymentNotification?> GetNotificationAsync(string externalReference, CancellationToken cancellationToken) => finance.GetSchoolPaymentNotificationAsync(externalReference, cancellationToken);

    private static string CreateReceiptNumber(string externalReference)
    {
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(externalReference));
        return $"SP-{Convert.ToHexString(digest)[..40]}";
    }

    private async Task<bool> IsProcessedAsyncCore(string externalReference, CancellationToken cancellationToken)
    {
        var notification = await finance.GetSchoolPaymentNotificationAsync(externalReference, cancellationToken);
        return notification is not null && notification.Status is "Processed" or "Failed" or "Reversed";
    }
}
