namespace SchoolManagement.Application.Audit;

public sealed record AuditLogDto(
    Guid Id,
    string? UserId,
    string Action,
    string EntityType,
    string? EntityId,
    string? Changes,
    string? IpAddress,
    string? UserAgent,
    DateTimeOffset Timestamp);
