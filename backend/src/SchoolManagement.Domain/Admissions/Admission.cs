namespace SchoolManagement.Domain.Admissions;

/// <summary>
/// Records an institution's admission decision and the academic placement
/// resulting from an accepted application.
/// </summary>
public sealed class Admission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ApplicantId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid AcademicYearId { get; init; }
    public string Intake { get; init; } = "Main";
    public string Status { get; set; } = "Pending";
    public string? AdmissionNumber { get; init; }
    public DateOnly? AdmissionDate { get; init; }
    public DateOnly? ReportingDate { get; init; }
    public string? DecisionReference { get; init; }
}
