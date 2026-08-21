namespace SchoolManagement.Domain.Attendance;

/// <summary>
/// A concrete attendance session generated from a scheduled timetable entry.
/// </summary>
public sealed class AttendanceSession
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TimetableEntryId { get; init; }
    public DateOnly SessionDate { get; init; }
    public string Status { get; set; } = "Open";
    public Guid? RecordedByUserId { get; init; }
    public string? Remarks { get; set; }
}
