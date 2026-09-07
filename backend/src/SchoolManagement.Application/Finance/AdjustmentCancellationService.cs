using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class AdjustmentCancellationService
{
    public FinanceAuditEvent CancelStudentCharge(StudentCharge charge, string performedBy, string reason)
    {
        ArgumentNullException.ThrowIfNull(charge);
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("Performing user is required.", nameof(performedBy));
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Cancellation reason is required.", nameof(reason));
        if (string.Equals(charge.Status, "Voided", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The student charge has already been cancelled.");

        charge.Status = "Voided";
        charge.VoidedAt = DateTimeOffset.UtcNow;
        charge.VoidedBy = performedBy.Trim();
        charge.VoidReason = reason.Trim();

        return new FinanceAuditEvent
        {
            Action = "AdjustmentCancelled",
            EntityType = nameof(StudentCharge),
            EntityId = charge.Id,
            PerformedBy = performedBy.Trim(),
            Reason = reason.Trim(),
            Metadata = $"StudentId={charge.StudentId};Amount={charge.Amount:0.00};Currency={charge.Currency}"
        };
    }
}
