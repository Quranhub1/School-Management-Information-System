using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

public sealed class AttendanceService(SchoolManagement.Application.Abstractions.IAttendanceRepository attendance)
{
    public async Task<AttendanceSession> OpenSessionAsync(
        Guid timetableEntryId,
        DateOnly sessionDate,
        Guid? recordedByUserId,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        var existing = await attendance.GetSessionAsync(timetableEntryId, sessionDate, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("An attendance session already exists for this timetable entry and date.");

        var session = new AttendanceSession
        {
            TimetableEntryId = timetableEntryId,
            SessionDate = sessionDate,
            RecordedByUserId = recordedByUserId,
            Remarks = remarks
        };

        await attendance.AddSessionAsync(session, cancellationToken);
        await attendance.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<StudentAttendance> MarkAsync(
        Guid attendanceSessionId,
        Guid studentId,
        string status,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("Attendance status is required.", nameof(status));

        var existing = await attendance.GetStudentAttendanceAsync(attendanceSessionId, studentId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Attendance has already been recorded for this student in this session.");

        var record = new StudentAttendance
        {
            AttendanceSessionId = attendanceSessionId,
            StudentId = studentId,
            Status = status.Trim(),
            Remarks = remarks
        };

        await attendance.AddStudentAttendanceAsync(record, cancellationToken);
        await attendance.SaveChangesAsync(cancellationToken);
        return record;
    }

    public Task<IReadOnlyList<StudentAttendance>> GetStudentHistoryAsync(
        Guid studentId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default) =>
        attendance.GetStudentAttendanceAsync(studentId, from, to, cancellationToken);
}
