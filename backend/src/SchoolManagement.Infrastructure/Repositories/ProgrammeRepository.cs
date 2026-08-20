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
}
