using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AcademicClassRepository(SchoolManagementDbContext db) : IAcademicClassRepository
{
    public async Task<IReadOnlyList<AcademicClass>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default) =>
        await db.Set<AcademicClass>().AsNoTracking().Where(x => x.ProgrammeId == programmeId).OrderBy(x => x.YearOfStudy).ThenBy(x => x.Code).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<AcademicClass>> GetByPeriodAsync(Guid periodId, CancellationToken cancellationToken = default) =>
        await db.Set<AcademicClass>().AsNoTracking().Where(x => x.AcademicPeriodId == periodId).OrderBy(x => x.Code).ToListAsync(cancellationToken);

    public Task<AcademicClass?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<AcademicClass>().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CodeExistsAsync(Guid programmeId, Guid periodId, string code, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Set<AcademicClass>().AnyAsync(x => x.ProgrammeId == programmeId && x.AcademicPeriodId == periodId && x.Code == code && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(AcademicClass academicClass, CancellationToken cancellationToken = default) =>
        db.Set<AcademicClass>().AddAsync(academicClass, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}