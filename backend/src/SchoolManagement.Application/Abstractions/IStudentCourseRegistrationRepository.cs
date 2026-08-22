using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IStudentCourseRegistrationRepository
{
    Task<IReadOnlyList<StudentCourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<bool> ExistsActiveAsync(Guid studentId, Guid courseOfferingId, CancellationToken cancellationToken = default);
    Task AddAsync(StudentCourseRegistration registration, CancellationToken cancellationToken = default);
    Task UpdateAsync(StudentCourseRegistration registration, CancellationToken cancellationToken = default);
}
