using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

public sealed record AttendanceSessionDto(
    Guid Id,
    Guid TimetableEntryId,
    DateOnly SessionDate,
    string Status,
    Guid? RecordedByUserId,
    string? Remarks)
{
    public static AttendanceSessionDto FromDomain(AttendanceSession session) =>
        new(session.Id, session.TimetableEntryId, session.SessionDate, session.Status, session.RecordedByUserId, session.Remarks);
}

public sealed record StudentAttendanceDto(
    Guid Id,
    Guid AttendanceSessionId,
    Guid StudentId,
    string Status,
    string? Remarks)
{
    public static StudentAttendanceDto FromDomain(StudentAttendance record) =>
        new(record.Id, record.AttendanceSessionId, record.StudentId, record.Status, record.Remarks);
}
