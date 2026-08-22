using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class ProgrammeRepository(SchoolManagementDbContext db) : IProgrammeRepository
{
    public async Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Programmes.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);

    public Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Programmes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Programmes.AnyAsync(x => x.Code == code && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(Programme programme, CancellationToken cancellationToken = default) =>
        db.Programmes.AddAsync(programme, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
