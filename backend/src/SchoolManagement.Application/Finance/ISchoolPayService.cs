namespace SchoolManagement.Application.Finance;

public interface ISchoolPayService
{
    Task<SchoolPayPaymentResult> ProcessNotificationAsync(string externalReference, string schoolPayReference, Guid? studentId, Guid? studentInvoiceId, decimal amount, string currency, string phoneNumber, string? payerName, string rawPayload, CancellationToken cancellationToken);
    Task<bool> IsProcessedAsync(string externalReference, CancellationToken cancellationToken);
}

public sealed record SchoolPayPaymentResult(string ExternalReference, string Status, DateTimeOffset? ProcessedAt, string? ErrorMessage);
