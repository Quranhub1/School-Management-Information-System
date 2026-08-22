using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CurriculumRepository(SchoolManagementDbContext db) : ICurriculumRepository
{
    public async Task<IReadOnlyList<Curriculum>> GetAllAsync(CancellationToken ct = default) => await db.Curricula.AsNoTracking().OrderBy(x => x.ProgrammeId).ThenByDescending(x => x.EffectiveFrom).ThenBy(x => x.Version).ToListAsync(ct);
    public Task<Curriculum?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Curricula.FirstOrDefaultAsync(x => x.Id == id, ct);
    public Task<bool> VersionExistsAsync(Guid programmeId, string version, Guid? excludingId = null, CancellationToken ct = default) => db.Curricula.AnyAsync(x => x.ProgrammeId == programmeId && x.Version == version && (!excludingId.HasValue || x.Id != excludingId.Value), ct);
    public Task AddAsync(Curriculum curriculum, CancellationToken ct = default) => db.Curricula.AddAsync(curriculum, ct).AsTask();
    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
