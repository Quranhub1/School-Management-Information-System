using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

/// <summary>
/// Attendance repository contract exposed from the Attendance application module.
/// The infrastructure implementation also satisfies the shared application abstraction.
/// </summary>
public interface IAttendanceRepository : SchoolManagement.Application.Abstractions.IAttendanceRepository
{
    Task<AttendanceSession?> GetSessionAsync(
        Guid timetableEntryId,
        DateOnly sessionDate,
        CancellationToken cancellationToken = default);

    Task<StudentAttendance?> GetStudentAttendanceAsync(
        Guid attendanceSessionId,
        Guid studentId,
        CancellationToken cancellationToken = default);

    Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default);

    Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(
        Guid studentId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default);
}
