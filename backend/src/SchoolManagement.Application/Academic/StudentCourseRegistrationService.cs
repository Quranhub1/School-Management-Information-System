using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed class StudentCourseRegistrationService
{
    private readonly IStudentCourseRegistrationRepository _repository;

    public StudentCourseRegistrationService(IStudentCourseRegistrationRepository repository)
    {
        _repository = repository;
    }

    public Task<IReadOnlyList<StudentCourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => _repository.GetByStudentAsync(studentId, cancellationToken);

    public async Task<StudentCourseRegistration> RegisterAsync(Guid studentId, Guid courseOfferingId, CancellationToken cancellationToken = default)
    {
        if (await _repository.ExistsActiveAsync(studentId, courseOfferingId, cancellationToken))
            throw new InvalidOperationException("The student is already registered for this course offering.");

        var registration = new StudentCourseRegistration
        {
            StudentId = studentId,
            CourseOfferingId = courseOfferingId,
            Status = RegistrationStatus.Registered
        };

        await _repository.AddAsync(registration, cancellationToken);
        return registration;
    }

    public async Task DropAsync(StudentCourseRegistration registration, CancellationToken cancellationToken = default)
    {
        if (registration.Status != RegistrationStatus.Registered)
            throw new InvalidOperationException("Only an active registration can be dropped.");

        registration.Status = RegistrationStatus.Dropped;
        registration.DroppedAtUtc = DateTime.UtcNow;
        await _repository.UpdateAsync(registration, cancellationToken);
    }
}
