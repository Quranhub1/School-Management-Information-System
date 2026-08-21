namespace SchoolManagement.Domain.Assessment;

/// <summary>
/// Calculated academic standing for a student for one academic period.
/// </summary>
public sealed class AcademicResultSummary
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid AcademicYearId { get; init; }
    public Guid SemesterId { get; init; }
    public decimal TotalCreditUnits { get; set; }
    public decimal TotalGradePoints { get; set; }
    public decimal Gpa { get; set; }
    public decimal? Cgpa { get; set; }
    public string Standing { get; set; } = "Pending";
    public bool IsApproved { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
}
