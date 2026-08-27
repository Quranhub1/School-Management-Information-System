namespace SchoolManagement.Domain.Regulatory;

public sealed class RegulatoryCircular
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string CircularNumber { get; init; }
    public required string Title { get; init; }
    public required string RegulatoryBody { get; init; }
    public required string Content { get; init; }
    public DateOnly IssueDate { get; init; }
    public DateOnly? Deadline { get; init; }
    public string? AttachmentUrl { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
