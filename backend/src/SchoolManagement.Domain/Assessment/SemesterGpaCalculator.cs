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
}
