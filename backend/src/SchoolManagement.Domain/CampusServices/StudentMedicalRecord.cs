namespace SchoolManagement.Domain.CampusServices;

public sealed class StudentMedicalRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public string RecordType { get; set; } = "ClinicVisit";
    public string? Condition { get; set; }
    public string? Treatment { get; set; }
    public string? Medication { get; set; }
    public string? Notes { get; set; }
    public string? AttendedBy { get; set; }
    public DateOnly VisitDate { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
