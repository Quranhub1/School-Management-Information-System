using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed class CourseRegistrationService(
    ICourseRegistrationRepository repository,
    ICurriculumCourseRepository curriculumCourses,
    ICoursePrerequisiteRepository prerequisites)
{
    public Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => repository.GetByStudentAsync(studentId, cancellationToken);

    public async Task<CourseRegistration> RegisterAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken cancellationToken = default, Guid? campusId = null)
    {
        if (await repository.ExistsActiveAsync(studentId, courseId, semesterId, cancellationToken))
            throw new InvalidOperationException("The student is already registered for this course in this semester.");

        var missingPrereqs = await GetMissingPrerequisitesAsync(studentId, courseId, semesterId, cancellationToken);
        if (missingPrereqs.Count > 0)
            throw new InvalidOperationException("Cannot register: mandatory prerequisites not met: " + string.Join(", ", missingPrereqs));

        var registration = new CourseRegistration
        {
            StudentId = studentId,
            CourseId = courseId,
            SemesterId = semesterId,
            CampusId = campusId,
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

    private async Task<List<string>> GetMissingPrerequisitesAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken ct)
    {
        var missing = new List<string>();
        var prereqs = await prerequisites.GetByCourseAsync(courseId, ct);
        foreach (var p in prereqs.Where(p => p.IsMandatory))
        {
            var prereqCourse = await curriculumCourses.GetByIdAsync(p.PrerequisiteCourseId, ct);
            if (prereqCourse == null)
            {
                missing.Add($"Prerequisite course {p.PrerequisiteCourseId} not found in curriculum");
                continue;
            }
        }
        return missing;
    }
}
