using SchoolManagement.Domain.Audit;

namespace SchoolManagement.Application.Audit;

public interface IAuditLogRepository
{
    Task<IReadOnlyList<AuditLog>> SearchAsync(string? userId = null, string? action = null, string? entityType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default);
    Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(AuditLog auditLog, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
