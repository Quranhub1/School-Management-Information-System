namespace SchoolManagement.Domain.Staff;

public sealed class StaffAllowance
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StaffMemberId { get; init; }
    public required string AllowanceType { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "UGX";
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public string Frequency { get; set; } = "Monthly";
    public string? Reason { get; set; }
    public string Status { get; set; } = "Authorized";
    public string? AuthorizedBy { get; set; }
    public DateTimeOffset? AuthorizedAt { get; set; }
    public string? RecordedBy { get; set; }
    public DateTimeOffset? RecordedAt { get; set; }
    public string? Reference { get; set; }
}
