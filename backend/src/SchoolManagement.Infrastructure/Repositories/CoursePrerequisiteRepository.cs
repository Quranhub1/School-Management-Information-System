using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CoursePrerequisiteRepository(SchoolManagementDbContext db) : ICoursePrerequisiteRepository
{
    public async Task<IReadOnlyList<CoursePrerequisite>> GetByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        await db.CoursePrerequisites.AsNoTracking().Where(x => x.CourseId == courseId).ToListAsync(cancellationToken);

    public Task<CoursePrerequisite?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.CoursePrerequisites.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> ExistsAsync(Guid courseId, Guid prerequisiteCourseId, CancellationToken cancellationToken = default) =>
        db.CoursePrerequisites.AnyAsync(x => x.CourseId == courseId && x.PrerequisiteCourseId == prerequisiteCourseId, cancellationToken);

    public Task AddAsync(CoursePrerequisite prerequisite, CancellationToken cancellationToken = default) =>
        db.CoursePrerequisites.AddAsync(prerequisite, cancellationToken).AsTask();

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.CoursePrerequisites.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null)
            db.CoursePrerequisites.Remove(entity);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
