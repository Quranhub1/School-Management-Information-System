using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class SemesterRepository(SchoolManagementDbContext db) : ISemesterRepository
{
    public async Task<IReadOnlyList<Semester>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken cancellationToken = default) =>
        await db.Semesters.AsNoTracking().Where(x => x.AcademicYearId == academicYearId).OrderBy(x => x.Sequence).ToListAsync(cancellationToken);

    public Task<Semester?> GetByIdAsync(Guid id, bool tracked = false, CancellationToken cancellationToken = default) =>
        (tracked ? db.Semesters : db.Semesters.AsNoTracking()).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> NameOrSequenceExistsAsync(Guid academicYearId, string name, int sequence, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Semesters.AnyAsync(x => x.AcademicYearId == academicYearId && (!excludingId.HasValue || x.Id != excludingId.Value) && (x.Name == name || x.Sequence == sequence), cancellationToken);

    public Task<bool> OverlapsAsync(Guid academicYearId, DateOnly startDate, DateOnly endDate, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Semesters.AnyAsync(x => x.AcademicYearId == academicYearId && (!excludingId.HasValue || x.Id != excludingId.Value) && x.StartDate <= endDate && startDate <= x.EndDate, cancellationToken);

    public Task AddAsync(Semester semester, CancellationToken cancellationToken = default) => db.Semesters.AddAsync(semester, cancellationToken).AsTask();

    public async Task SetCurrentAsync(Guid academicYearId, Guid semesterId, CancellationToken cancellationToken = default)
    {
        await db.Semesters.Where(x => x.AcademicYearId == academicYearId && x.IsCurrent && x.Id != semesterId).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, false), cancellationToken);
        await db.Semesters.Where(x => x.Id == semesterId && x.AcademicYearId == academicYearId).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, true), cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
