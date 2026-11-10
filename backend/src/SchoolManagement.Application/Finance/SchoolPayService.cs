using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class SchoolPayService(IFinanceRepository finance, FinanceService financeService) : ISchoolPayService
{
    public async Task<SchoolPaymentNotification> ProcessNotificationAsync(string externalReference, string schoolPayReference, Guid? studentId, Guid? studentInvoiceId, decimal amount, string currency, string phoneNumber, string? payerName, string rawPayload, CancellationToken cancellationToken, string? providerTransactionId = null, string? sourceChannel = null, string? providerStatus = null)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) throw new ArgumentException("External reference is required.");
        if (string.IsNullOrWhiteSpace(schoolPayReference)) throw new ArgumentException("SchoolPay reference is required.");
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.");
        if (!string.Equals(providerStatus?.Trim(), "PAID", StringComparison.OrdinalIgnoreCase) && !string.Equals(providerStatus?.Trim(), "Completed", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("SchoolPay transaction is not confirmed as paid/completed.");
        if (string.IsNullOrWhiteSpace(providerTransactionId)) throw new ArgumentException("SchoolPay provider transaction ID is required.");
        if (string.IsNullOrWhiteSpace(sourceChannel)) throw new ArgumentException("SchoolPay source channel is required.");

        var normalizedExternalRef = externalReference.Trim();
        var normalizedTransactionId = providerTransactionId.Trim();
        var existing = await finance.GetSchoolPaymentNotificationAsync(normalizedExternalRef, cancellationToken);
        if (existing is not null) return existing;

        var notification = new SchoolPaymentNotification
        {
            ExternalReference = normalizedExternalRef,
            SchoolPayReference = schoolPayReference.Trim(),
            ProviderTransactionId = normalizedTransactionId,
            SourceChannel = sourceChannel.Trim(),
            ProviderStatus = providerStatus!.Trim().ToUpperInvariant(),
            StudentId = studentId,
            StudentInvoiceId = studentInvoiceId,
            Amount = amount,
            Currency = currency.Trim().ToUpperInvariant(),
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
                await financeService.RecordPaymentAsync(studentInvoiceId.Value, receiptNumber, amount, "SchoolPay", schoolPayReference, cancellationToken, sourceChannel, normalizedTransactionId, saveChanges: false);
            }
            else if (studentId.HasValue)
            {
                var receiptNumber = CreateReceiptNumber(normalizedExternalRef);
                await financeService.RecordUnallocatedPaymentAsync(studentId.Value, receiptNumber, amount, "SchoolPay", currency, schoolPayReference, cancellationToken, sourceChannel, normalizedTransactionId, saveChanges: false, allocateToOutstandingInvoices: true);
            }
            else
            {
                throw new InvalidOperationException("SchoolPay notification must include either a student ID or a student invoice ID.");
            }

            notification.Status = "Processed";
            notification.ProcessedAt = DateTimeOffset.UtcNow;
        }
        catch (Exception ex)
        {
            notification.Status = "Failed";
            notification.ErrorMessage = ex.Message;
            throw;
        }

        await finance.SaveChangesAsync(cancellationToken);
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
        var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(externalReference)));
        return $"SP-{hash[..20]}";
    }

    private async Task<bool> IsProcessedAsyncCore(string externalReference, CancellationToken cancellationToken)
    {
        var notification = await finance.GetSchoolPaymentNotificationAsync(externalReference, cancellationToken);
        return notification is not null && notification.Status is "Processed" or "Failed" or "Reversed";
    }
}
