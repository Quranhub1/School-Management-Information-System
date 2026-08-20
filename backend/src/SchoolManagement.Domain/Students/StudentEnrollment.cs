namespace SchoolManagement.Domain.Students;

/// <summary>
/// Connects a student to a programme, academic year and intake while preserving
/// the student's historical academic placements.
/// </summary>
public sealed class StudentEnrollment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid AcademicYearId { get; init; }
    public string Intake { get; init; } = "Main";
    public string RegistrationStatus { get; set; } = "Pending";
    public string StudentStatus { get; set; } = "Active";
    public DateOnly EnrollmentDate { get; init; }
    public int CurrentYearOfStudy { get; set; } = 1;
    public int? CurrentSemester { get; set; }
}
