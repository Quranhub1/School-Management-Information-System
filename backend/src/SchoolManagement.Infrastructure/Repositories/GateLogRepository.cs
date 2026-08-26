using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Access;
using SchoolManagement.Domain.Access;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class GateLogRepository(SchoolManagementDbContext db) : IGateLogRepository
{
    public async Task<IReadOnlyList<GateLog>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await db.GateLogs.AsNoTracking().OrderByDescending(x => x.EntryTime).ToListAsync(cancellationToken);

    public Task<GateLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.GateLogs.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<GateLog>> SearchAsync(string? personName = null, string? personType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.GateLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(personName)) query = query.Where(x => x.PersonName.Contains(personName.Trim()));
        if (!string.IsNullOrWhiteSpace(personType)) query = query.Where(x => x.PersonType == personType.Trim());
        if (from.HasValue) query = query.Where(x => x.EntryTime >= from.Value);
        if (to.HasValue) query = query.Where(x => x.EntryTime <= to.Value);
        return await query.OrderByDescending(x => x.EntryTime).ToListAsync(cancellationToken);
    }

    public async Task AddAsync(GateLog gateLog, CancellationToken cancellationToken = default) => await db.GateLogs.AddAsync(gateLog, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
