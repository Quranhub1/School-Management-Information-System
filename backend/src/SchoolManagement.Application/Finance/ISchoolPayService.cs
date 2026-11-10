using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public interface ISchoolPayService
{
    Task<SchoolPaymentNotification> ProcessNotificationAsync(string externalReference, string schoolPayReference, Guid? studentId, Guid? studentInvoiceId, decimal amount, string currency, string phoneNumber, string? payerName, string rawPayload, CancellationToken cancellationToken, string? providerTransactionId = null, string? sourceChannel = null, string? providerStatus = null);
    Task<bool> IsProcessedAsync(string externalReference, CancellationToken cancellationToken);
    Task<IReadOnlyList<SchoolPaymentNotification>> GetNotificationsAsync(CancellationToken cancellationToken);
    Task<SchoolPaymentNotification?> GetNotificationAsync(string externalReference, CancellationToken cancellationToken);
}
