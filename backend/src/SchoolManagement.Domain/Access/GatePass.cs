namespace SchoolManagement.Domain.Access;

public sealed class GatePass
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public string PassType { get; set; } = "Regular";
    public string? Reason { get; set; }
    public string? Destination { get; set; }
    public string? AuthorizedBy { get; set; }
    public string? ParentGuardianContact { get; set; }
    public DateOnly ExpectedReturnDate { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset IssuedAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ApprovedAtUtc { get; set; }
    public DateTimeOffset? UsedAtUtc { get; set; }
    public DateTimeOffset? ReturnedAtUtc { get; set; }
    public string? Notes { get; set; }
}
