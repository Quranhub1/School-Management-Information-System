namespace SchoolManagement.Domain.Academic;

public sealed class StudentEnrollment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid IntakeId { get; init; }
    public DateOnly AdmissionDate { get; init; }
    public required string Status { get; set; }
    public int CurrentYear { get; set; } = 1;
}
