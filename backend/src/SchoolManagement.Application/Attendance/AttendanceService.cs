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
            Status = AttendanceSessionStatus.Open
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

        if (session.Status != AttendanceSessionStatus.Open)
            throw new InvalidOperationException("Only an open attendance session can be closed.");

        session.Status = AttendanceSessionStatus.Closed;
        await attendance.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<StudentAttendance> MarkAsync(
        Guid attendanceSessionId,
        Guid studentId,
        AttendanceStatus status,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty)
            throw new ArgumentException("A student is required.", nameof(studentId));

        var session = await attendance.GetSessionByIdAsync(attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        if (session.Status != AttendanceSessionStatus.Open)
            throw new InvalidOperationException("Attendance cannot be recorded after the session has been closed.");

        if (!await attendance.IsStudentEligibleForSessionAsync(attendanceSessionId, studentId, cancellationToken))
            throw new InvalidOperationException("The student is not registered for the course associated with this attendance session.");

        var existing = await attendance.GetStudentAttendanceAsync(attendanceSessionId, studentId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("Attendance has already been recorded for this student in this session.");

        var record = new StudentAttendance
        {
            AttendanceSessionId = attendanceSessionId,
            StudentId = studentId,
            Status = status,
            Remarks = remarks?.Trim()
        };

        await attendance.AddStudentAttendanceAsync(record, cancellationToken);
        await attendance.SaveChangesAsync(cancellationToken);
        return record;
    }

    public async Task<IReadOnlyList<StudentAttendance>> MarkBulkAsync(
        Guid attendanceSessionId,
        IReadOnlyList<BulkMarkRequest> requests,
        CancellationToken cancellationToken = default)
    {
        if (requests == null || requests.Count == 0)
            throw new ArgumentException("At least one student is required.", nameof(requests));

        var session = await attendance.GetSessionByIdAsync(attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        if (session.Status != AttendanceSessionStatus.Open)
            throw new InvalidOperationException("Attendance cannot be recorded after the session has been closed.");

        var results = new List<StudentAttendance>(requests.Count);

        foreach (var request in requests)
        {
            if (request.StudentId == Guid.Empty)
                throw new ArgumentException("A student is required.", nameof(requests));

            if (!await attendance.IsStudentEligibleForSessionAsync(attendanceSessionId, request.StudentId, cancellationToken))
                throw new InvalidOperationException($"Student {request.StudentId} is not registered for this session's course.");

            var existing = await attendance.GetStudentAttendanceAsync(attendanceSessionId, request.StudentId, cancellationToken);
            if (existing is not null)
                throw new InvalidOperationException($"Attendance has already been recorded for student {request.StudentId} in this session.");

            var record = new StudentAttendance
            {
                AttendanceSessionId = attendanceSessionId,
                StudentId = request.StudentId,
                Status = request.Status,
                Remarks = request.Remarks?.Trim()
            };

            await attendance.AddStudentAttendanceAsync(record, cancellationToken);
            results.Add(record);
        }

        await attendance.SaveChangesAsync(cancellationToken);
        return results;
    }

    public Task<IReadOnlyList<StudentAttendance>> GetStudentHistoryAsync(
        Guid studentId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default) =>
        attendance.GetStudentAttendanceAsync(studentId, from, to, cancellationToken);

    public Task<IReadOnlyList<EligibleStudentDto>> GetEligibleStudentsAsync(
        Guid attendanceSessionId,
        CancellationToken cancellationToken = default) =>
        attendance.GetEligibleStudentsAsync(attendanceSessionId, cancellationToken);

    public Task<SessionSummaryDto> GetSessionSummaryAsync(
        Guid attendanceSessionId,
        CancellationToken cancellationToken = default) =>
        attendance.GetSessionSummaryAsync(attendanceSessionId, cancellationToken);
}

public sealed record BulkMarkRequest(Guid StudentId, AttendanceStatus Status, string? Remarks);
