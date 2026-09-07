namespace SchoolManagement.Domain.Finance;

public sealed class StaffAdvance
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StaffMemberId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string Reason { get; init; } = string.Empty;
    public string Status { get; init; } = "Pending";
    public DateTimeOffset RequestedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ApprovedAt { get; init; }
    public string? ApprovedBy { get; init; }
    public DateTimeOffset? RecoveredAt { get; init; }
    public Guid? RecoveredFromPayrollId { get; init; }
    public string? Notes { get; init; }
}
