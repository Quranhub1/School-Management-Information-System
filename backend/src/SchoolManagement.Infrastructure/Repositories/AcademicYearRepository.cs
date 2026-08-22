using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AcademicYearRepository(SchoolManagementDbContext db) : IAcademicYearRepository
{
    public async Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.AcademicYears.AsNoTracking().OrderByDescending(x => x.StartDate).ThenBy(x => x.Name).ToListAsync(cancellationToken);

    public Task<AcademicYear?> GetByIdAsync(Guid id, bool tracked = false, CancellationToken cancellationToken = default) =>
        (tracked ? db.AcademicYears : db.AcademicYears.AsNoTracking()).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(string name, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.AcademicYears.AnyAsync(x => x.Name == name && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default) =>
        db.AcademicYears.AddAsync(academicYear, cancellationToken).AsTask();

    public async Task SetCurrentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await db.AcademicYears.Where(x => x.IsCurrent && x.Id != id).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, false), cancellationToken);
        await db.AcademicYears.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, true), cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
