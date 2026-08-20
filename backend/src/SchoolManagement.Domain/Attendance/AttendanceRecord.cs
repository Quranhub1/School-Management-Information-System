namespace SchoolManagement.Domain.Attendance;

public sealed class AttendanceRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseId { get; init; }
    public Guid SemesterId { get; init; }
    public DateOnly AttendanceDate { get; init; }
    public required string Status { get; set; }
    public string? Remarks { get; set; }
    public Guid? RecordedByUserId { get; init; }
}
