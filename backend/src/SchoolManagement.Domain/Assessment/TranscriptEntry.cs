namespace SchoolManagement.Domain.Assessment;

public sealed class TranscriptEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseRegistrationId { get; init; }
    public Guid AcademicYearId { get; init; }
    public Guid SemesterId { get; init; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
    public decimal CreditUnits { get; set; }
    public decimal Score { get; set; }
    public string? Grade { get; set; }
    public decimal GradePoint { get; set; }
    public bool IsPass { get; set; }
}
