namespace SchoolManagement.Domain.Examinations;

/// <summary>
/// Immutable academic history entry used when composing an official transcript.
/// </summary>
public sealed class TranscriptEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseRegistrationId { get; init; }
    public required string CourseCode { get; set; }
    public required string CourseTitle { get; set; }
    public decimal CreditUnits { get; set; }
    public decimal TotalScore { get; set; }
    public required string Grade { get; set; }
    public decimal GradePoint { get; set; }
    public bool Passed { get; set; }
    public int AcademicYear { get; set; }
    public int Semester { get; set; }
}
