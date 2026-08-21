namespace SchoolManagement.Domain.Attendance;

/// <summary>
/// Attendance status recorded for one student in one attendance session.
/// </summary>
public sealed class StudentAttendance
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AttendanceSessionId { get; init; }
    public Guid StudentId { get; init; }
    public required string Status { get; set; }
    public string? Remarks { get; set; }
}
