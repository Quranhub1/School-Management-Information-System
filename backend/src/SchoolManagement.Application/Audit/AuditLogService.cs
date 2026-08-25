using SchoolManagement.Domain.Audit;

namespace SchoolManagement.Application.Audit;

public sealed class AuditLogService(IAuditLogRepository auditLogRepository)
{
    public async Task<IReadOnlyList<AuditLog>> SearchAsync(string? userId = null, string? action = null, string? entityType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default) =>
        await auditLogRepository.SearchAsync(userId, action, entityType, from, to, cancellationToken);

    public async Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await auditLogRepository.GetByIdAsync(id, cancellationToken);

    public async Task LogAsync(string action, string entityType, string? entityId, string? userId, string? changes, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            UserId = userId,
            Changes = changes,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Timestamp = DateTimeOffset.UtcNow
        };
        await auditLogRepository.AddAsync(auditLog, cancellationToken);
        await auditLogRepository.SaveChangesAsync(cancellationToken);
    }
}
