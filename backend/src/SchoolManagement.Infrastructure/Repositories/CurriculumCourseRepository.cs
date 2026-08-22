using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CurriculumCourseRepository(SchoolManagementDbContext db) : ICurriculumCourseRepository
{
    public async Task<IReadOnlyList<CurriculumCourse>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) => await db.CurriculumCourses.AsNoTracking().Where(x => x.CurriculumId == curriculumId).OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber).ThenBy(x => x.CourseId).ToListAsync(ct);
    public Task<bool> ExistsAsync(Guid curriculumId, Guid courseId, CancellationToken ct = default) => db.CurriculumCourses.AnyAsync(x => x.CurriculumId == curriculumId && x.CourseId == courseId, ct);
    public Task AddAsync(CurriculumCourse mapping, CancellationToken ct = default) => db.CurriculumCourses.AddAsync(mapping, ct).AsTask();
    public async Task RemoveAsync(Guid id, CancellationToken ct = default) { var entity = await db.CurriculumCourses.FirstOrDefaultAsync(x => x.Id == id, ct); if (entity is not null) db.CurriculumCourses.Remove(entity); }
    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
