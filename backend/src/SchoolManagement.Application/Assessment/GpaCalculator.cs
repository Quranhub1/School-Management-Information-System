using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

/// <summary>
/// Calculates semester GPA and cumulative CGPA from finalized transcript entries.
/// The grading scale remains institution/programme configurable through GradeBand.
/// </summary>
public sealed class GpaCalculator
{
    public AcademicResultCalculation Calculate(
        Guid studentId,
        Guid academicYearId,
        Guid semesterId,
        IReadOnlyCollection<TranscriptEntry> semesterEntries,
        IReadOnlyCollection<TranscriptEntry> cumulativeEntries)
    {
        ArgumentNullException.ThrowIfNull(semesterEntries);
        ArgumentNullException.ThrowIfNull(cumulativeEntries);

        var semester = CalculateWeighted(semesterEntries, studentId, "semester");
        var cumulative = CalculateWeighted(cumulativeEntries, studentId, "cumulative");

        return new AcademicResultCalculation
        {
            StudentId = studentId,
            AcademicYearId = academicYearId,
            SemesterId = semesterId,
            SemesterCreditUnits = semester.Credits,
            SemesterGradePoints = semester.WeightedPoints,
            Gpa = semester.Gpa,
            CumulativeCreditUnits = cumulative.Credits,
            CumulativeGradePoints = cumulative.WeightedPoints,
            Cgpa = cumulative.Gpa
        };
    }

    private static WeightedResult CalculateWeighted(
        IReadOnlyCollection<TranscriptEntry> entries,
        Guid studentId,
        string scope)
    {
        var studentEntries = entries.Where(x => x.StudentId == studentId).ToList();
        if (studentEntries.Count == 0)
            throw new InvalidOperationException($"No transcript entries were supplied for the {scope} calculation.");

        if (studentEntries.Any(x => x.CreditUnits <= 0m))
            throw new InvalidOperationException("Credit units must be greater than zero for GPA/CGPA calculation.");

        var credits = studentEntries.Sum(x => x.CreditUnits);
        var weightedPoints = studentEntries.Sum(x => x.CreditUnits * x.GradePoint);
        var average = weightedPoints / credits;

        return new WeightedResult(
            credits,
            weightedPoints,
            decimal.Round(average, 2, MidpointRounding.AwayFromZero));
    }

    private sealed record WeightedResult(decimal Credits, decimal WeightedPoints, decimal Gpa);
}

public sealed class AcademicResultCalculation
{
    public Guid StudentId { get; init; }
    public Guid AcademicYearId { get; init; }
    public Guid SemesterId { get; init; }
    public decimal SemesterCreditUnits { get; init; }
    public decimal SemesterGradePoints { get; init; }
    public decimal Gpa { get; init; }
    public decimal CumulativeCreditUnits { get; init; }
    public decimal CumulativeGradePoints { get; init; }
    public decimal Cgpa { get; init; }
}
