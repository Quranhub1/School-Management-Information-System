namespace SchoolManagement.Domain.Academic;

public sealed class StudentAcademicStatus
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid SemesterId { get; init; }
    public int YearOfStudy { get; init; }
    public required string Status { get; set; }
    public decimal? Gpa { get; set; }
    public decimal? CumulativeGpa { get; set; }
    public int CreditsAttempted { get; set; }
    public int CreditsEarned { get; set; }
}
