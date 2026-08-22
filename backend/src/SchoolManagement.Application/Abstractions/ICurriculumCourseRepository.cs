using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ICurriculumCourseRepository
{
    Task<IReadOnlyList<CurriculumCourse>> GetByCurriculumAsync(Guid curriculumId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid curriculumId, Guid courseId, CancellationToken cancellationToken = default);
    Task AddAsync(CurriculumCourse mapping, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
