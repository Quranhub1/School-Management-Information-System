using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class SubjectRepository(SchoolManagementDbContext db) : ISubjectRepository
{
    public async Task<IReadOnlyList<Subject>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default) =>
        await db.Subjects.AsNoTracking().Where(x => x.ProgrammeId == programmeId).OrderBy(x => x.YearOfStudy).ThenBy(x => x.CourseId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Subject>> GetByProgrammeAndYearAsync(Guid programmeId, int yearOfStudy, CancellationToken cancellationToken = default) =>
        await db.Subjects.AsNoTracking().Where(x => x.ProgrammeId == programmeId && x.YearOfStudy == yearOfStudy).ToListAsync(cancellationToken);

    public Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Subjects.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CourseExistsAsync(Guid programmeId, Guid courseId, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Subjects.AnyAsync(x => x.ProgrammeId == programmeId && x.CourseId == courseId && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(Subject subject, CancellationToken cancellationToken = default) =>
        db.Subjects.AddAsync(subject, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
