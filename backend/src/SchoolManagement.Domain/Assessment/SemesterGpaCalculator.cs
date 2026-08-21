using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Domain.Assessment;

/// <summary>
/// Calculates credit-unit weighted semester GPA and cumulative GPA from finalized course results.
/// </summary>
public static class SemesterGpaCalculator
{
    public sealed record CourseResultInput(Guid CourseRegistrationId, decimal GradePoint, int CreditUnits, bool IsFinal);

    public sealed record GpaResult(decimal QualityPoints, int CreditUnits, decimal Gpa);

    public static GpaResult CalculateSemester(IEnumerable<CourseResultInput> results)
    {
        var finalized = results.Where(x => x.IsFinal).ToList();
        if (finalized.Count == 0)
            throw new InvalidOperationException("At least one finalized course result is required.");
        if (finalized.Any(x => x.CreditUnits <= 0))
            throw new InvalidOperationException("Credit units must be greater than zero.");
        if (finalized.Any(x => x.GradePoint < 0))
            throw new InvalidOperationException("Grade points cannot be negative.");

        var credits = finalized.Sum(x => x.CreditUnits);
        var qualityPoints = finalized.Sum(x => x.GradePoint * x.CreditUnits);
        return new GpaResult(qualityPoints, credits, decimal.Round(qualityPoints / credits, 2, MidpointRounding.AwayFromZero));
    }

    public static GpaResult CalculateCumulative(IEnumerable<GpaResult> semesters)
    {
        var completed = semesters.Where(x => x.CreditUnits > 0).ToList();
        if (completed.Count == 0)
            throw new InvalidOperationException("At least one semester result is required.");

        var credits = completed.Sum(x => x.CreditUnits);
        var qualityPoints = completed.Sum(x => x.QualityPoints);
        return new GpaResult(qualityPoints, credits, decimal.Round(qualityPoints / credits, 2, MidpointRounding.AwayFromZero));
    }

    public static decimal CalculateGpa(IEnumerable<AssessmentResult> results, IEnumerable<Course> courses)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(courses);
        var courseById = courses.ToDictionary(x => x.Id);
        var inputs = results.Where(x => x.IsFinal)
            .Select(x =>
            {
                if (!courseById.TryGetValue(x.CourseId, out var course))
                    throw new ArgumentException($"Course {x.CourseId} was not supplied.", nameof(courses));
                if (course.CreditUnits <= 0)
                    throw new ArgumentException($"Course {x.CourseId} must have positive credit units.", nameof(courses));
                return new CourseResultInput(x.CourseRegistrationId, x.GradePoint, course.CreditUnits, true);
            });
        return CalculateSemester(inputs).Gpa;
    }

    public static decimal CalculateCgpa(IEnumerable<(decimal Gpa, int CreditUnits)> semesters)
    {
        ArgumentNullException.ThrowIfNull(semesters);
        var values = semesters.ToList();
        if (values.Count == 0)
            throw new InvalidOperationException("At least one semester result is required.");
        if (values.Any(x => x.CreditUnits <= 0))
            throw new ArgumentException("Semester credit units must be positive.", nameof(semesters));
        var credits = values.Sum(x => x.CreditUnits);
        var qualityPoints = values.Sum(x => x.Gpa * x.CreditUnits);
        return decimal.Round(qualityPoints / credits, 2, MidpointRounding.AwayFromZero);
    }
}
