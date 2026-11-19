namespace SchoolManagement.Domain.Academic;

public sealed class CurriculumApprovalHistory
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; set; }
    public string? FromStatus { get; set; }
    public required string ToStatus { get; set; }
    public string? Notes { get; set; }
    public required string Actor { get; set; }
    public DateTimeOffset ChangedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
