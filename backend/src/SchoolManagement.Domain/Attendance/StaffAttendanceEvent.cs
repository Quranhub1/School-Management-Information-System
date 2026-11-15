namespace SchoolManagement.Domain.Attendance;

/// <summary>
/// Immutable staff attendance event produced after a trusted local biometric matcher identifies a staff member.
/// Fingerprint samples and templates are deliberately not stored in this entity.
/// </summary>
public sealed class StaffAttendanceEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StaffMemberId { get; set; }
    public required string EventType { get; set; }
    public DateTimeOffset RecordedAtUtc { get; set; }
    public required string DeviceId { get; set; }
    public required string CaptureId { get; set; }
    public string Source { get; set; } = "Fingerprint";
}
