using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ICourseRegistrationRepository
{
    Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<bool> ExistsActiveAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken cancellationToken = default);
    Task AddAsync(CourseRegistration registration, CancellationToken cancellationToken = default);
    Task UpdateAsync(CourseRegistration registration, CancellationToken cancellationToken = default);
}
