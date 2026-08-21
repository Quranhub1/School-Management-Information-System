namespace SchoolManagement.Domain.Assessment;

using SchoolManagement.Domain.Academic;

/// <summary>
/// Builds immutable transcript entries from finalized course results and their academic registrations.
/// </summary>
public static class TranscriptProcessor
{
    public static IReadOnlyList<TranscriptEntry> Generate(
        IEnumerable<AssessmentResult> results,
        IEnumerable<CourseRegistration> registrations,
        IEnumerable<Course> courses,
        Guid academicYearId,
        Guid semesterId)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(registrations);
        ArgumentNullException.ThrowIfNull(courses);

        var resultList = results.ToList();
        var registrationById = registrations.ToDictionary(x => x.Id);
        var courseById = courses.ToDictionary(x => x.Id);

        if (resultList.Count == 0)
            return [];

        var entries = new List<TranscriptEntry>(resultList.Count);
        var seenRegistrations = new HashSet<Guid>();

        foreach (var result in resultList)
        {
            if (!result.IsFinal)
                continue;

            if (!registrationById.TryGetValue(result.CourseRegistrationId, out var registration))
                throw new ArgumentException($"Course registration {result.CourseRegistrationId} was not supplied.", nameof(registrations));

            if (registration.StudentId != result.StudentId)
                throw new InvalidOperationException("Assessment result and course registration belong to different students.");

            if (registration.SemesterId != semesterId)
                continue;

            if (!courseById.TryGetValue(result.CourseId, out var course))
                throw new ArgumentException($"Course {result.CourseId} was not supplied.", nameof(courses));

            if (!seenRegistrations.Add(result.CourseRegistrationId))
                throw new InvalidOperationException($"Duplicate finalized result for course registration {result.CourseRegistrationId}.");

            entries.Add(new TranscriptEntry
            {
                Id = Guid.NewGuid(),
                StudentId = result.StudentId,
                CourseRegistrationId = result.CourseRegistrationId,
                AcademicYearId = academicYearId,
                SemesterId = semesterId,
                CourseCode = course.Code,
                CourseTitle = course.Name,
                CreditUnits = course.CreditUnits,
                Score = result.TotalScore,
                Grade = result.Grade,
                GradePoint = result.GradePoint,
                IsPass = result.GradePoint > 0m
            });
        }

        return entries;
    }
}
