using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Application.Academic;

public sealed class ProgrammeService(SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Programmes.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);

    public async Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.Programmes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
}
