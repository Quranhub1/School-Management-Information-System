using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed class CourseRegistrationService(ICourseRegistrationRepository repository)
{
    public Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => repository.GetByStudentAsync(studentId, cancellationToken);

    public async Task<CourseRegistration> RegisterAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken cancellationToken = default)
    {
        if (await repository.ExistsActiveAsync(studentId, courseId, semesterId, cancellationToken))
            throw new InvalidOperationException("The student is already registered for this course in this semester.");

        var registration = new CourseRegistration
        {
            StudentId = studentId,
            CourseId = courseId,
            SemesterId = semesterId,
            Status = "Registered"
        };

        await repository.AddAsync(registration, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return registration;
    }

    public async Task DropAsync(CourseRegistration registration, CancellationToken cancellationToken = default)
    {
        if (registration.Status != "Registered")
            throw new InvalidOperationException("Only an active registration can be dropped.");

        registration.Status = "Dropped";
        await repository.UpdateAsync(registration, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
    }
}
