namespace SchoolManagement.Domain.Communication;

public sealed class Notice
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string Body { get; set; }
    public string Priority { get; set; } = "General";
    public string Audience { get; set; } = "All";
    public DateTimeOffset? ExpiresAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
}
