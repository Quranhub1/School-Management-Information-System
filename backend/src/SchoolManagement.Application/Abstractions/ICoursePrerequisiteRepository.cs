using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ICoursePrerequisiteRepository
{
    Task<IReadOnlyList<CoursePrerequisite>> GetByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<CoursePrerequisite?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid courseId, Guid prerequisiteCourseId, CancellationToken cancellationToken = default);
    Task AddAsync(CoursePrerequisite prerequisite, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
