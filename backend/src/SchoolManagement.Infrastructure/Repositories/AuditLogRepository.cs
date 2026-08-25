using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Audit;
using SchoolManagement.Domain.Audit;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AuditLogRepository(SchoolManagementDbContext db) : IAuditLogRepository
{
    public async Task<IReadOnlyList<AuditLog>> SearchAsync(string? userId = null, string? action = null, string? entityType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(userId)) query = query.Where(x => x.UserId == userId.Trim());
        if (!string.IsNullOrWhiteSpace(action)) query = query.Where(x => x.Action == action.Trim());
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(x => x.EntityType == entityType.Trim());
        if (from.HasValue) query = query.Where(x => x.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(x => x.Timestamp <= to.Value);
        return await query.OrderByDescending(x => x.Timestamp).ToListAsync(cancellationToken);
    }

    public Task<AuditLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.AuditLogs.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(AuditLog auditLog, CancellationToken cancellationToken = default) => await db.AuditLogs.AddAsync(auditLog, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
