namespace SchoolManagement.Domain.Audit;

public sealed class AuditLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string? UserId { get; init; }
    public string Action { get; init; } = string.Empty;
    public string EntityType { get; init; } = string.Empty;
    public string? EntityId { get; init; }
    public string? Changes { get; set; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
}
