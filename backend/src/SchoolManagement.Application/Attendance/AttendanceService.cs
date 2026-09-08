using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

public sealed class AttendanceService(SchoolManagement.Application.Abstractions.IAttendanceRepository attendance)
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Present", "Absent", "Late", "Excused"
    };

    public async Task<AttendanceSession> OpenSessionAsync(
        Guid timetableEntryId,
        DateOnly sessionDate,
        Guid? recordedByUserId,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        if (timetableEntryId == Guid.Empty)
            throw new ArgumentException("A timetable entry is required.", nameof(timetableEntryId));

        var existing = await attendance.GetSessionAsync(timetableEntryId, sessionDate, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("An attendance session already exists for this timetable entry and date.");

        var session = new AttendanceSession
        {
            TimetableEntryId = timetableEntryId,
            SessionDate = sessionDate,
            RecordedByUserId = recordedByUserId,
            Remarks = remarks?.Trim(),
            Status = "Open"
        };

        await attendance.AddSessionAsync(session, cancellationToken);
        await attendance.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<AttendanceSession> CloseSessionAsync(
        Guid attendanceSessionId,
        CancellationToken cancellationToken = default)
    {
        var session = await attendance.GetSessionByIdAsync(attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        if (!string.Equals(session.Status, "Open", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only an open attendance session can be closed.");

        session.Status = "Closed";
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
        if (studentId == Guid.Empty)
            throw new ArgumentException("A student is required.", nameof(studentId));

        if (string.IsNullOrWhiteSpace(status))
            throw new ArgumentException("Attendance status is required.", nameof(status));

        var normalizedStatus = status.Trim();
        if (!AllowedStatuses.Contains(normalizedStatus))
            throw new ArgumentException("Attendance status must be Present, Absent, Late, or Excused.", nameof(status));

        var session = await attendance.GetSessionByIdAsync(attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        if (!string.Equals(session.Status, "Open", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Attendance cannot be recorded after the session has been closed.");

        var existing = await attendance.GetStudentAttendanceAsync(attendanceSessionId, studentId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Attendance has already been recorded for this student in this session.");

        var record = new StudentAttendance
        {
            AttendanceSessionId = attendanceSessionId,
            StudentId = studentId,
            Status = normalizedStatus,
            Remarks = remarks?.Trim()
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
