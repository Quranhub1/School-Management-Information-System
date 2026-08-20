namespace SchoolManagement.Domain.Academic;

public sealed class Admission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid ProgrammeId { get; init; }
    public Guid IntakeId { get; init; }
    public required string AdmissionNumber { get; init; }
    public required string AdmissionType { get; init; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset AppliedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AdmittedAt { get; set; }
}
