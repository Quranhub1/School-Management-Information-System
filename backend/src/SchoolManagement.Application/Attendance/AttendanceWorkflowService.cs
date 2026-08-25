namespace SchoolManagement.Application.Attendance;

public sealed class AttendanceWorkflowService(AttendanceService attendance)
{
    public async Task<AttendanceSessionDto> OpenSessionAsync(
        Guid timetableEntryId,
        DateOnly sessionDate,
        Guid? recordedByUserId,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        var session = await attendance.OpenSessionAsync(
            timetableEntryId,
            sessionDate,
            recordedByUserId,
            remarks,
            cancellationToken);

        return AttendanceSessionDto.FromDomain(session);
    }

    public async Task<StudentAttendanceDto> MarkAsync(
        Guid attendanceSessionId,
        Guid studentId,
        string status,
        string? remarks = null,
        CancellationToken cancellationToken = default)
    {
        var record = await attendance.MarkAsync(
            attendanceSessionId,
            studentId,
            status,
            remarks,
            cancellationToken);

        return StudentAttendanceDto.FromDomain(record);
    }

    public async Task<IReadOnlyList<StudentAttendanceDto>> GetStudentHistoryAsync(
        Guid studentId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
            throw new ArgumentException("The start date cannot be later than the end date.");

        var records = await attendance.GetStudentHistoryAsync(studentId, from, to, cancellationToken);
        return records.Select(StudentAttendanceDto.FromDomain).ToList();
    }
}
