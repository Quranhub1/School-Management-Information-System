using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Abstractions;

public interface IAttendanceRepository
{
    Task<AttendanceSession?> GetSessionAsync(Guid timetableEntryId, DateOnly sessionDate, CancellationToken cancellationToken = default);
    Task<AttendanceSession?> GetSessionByIdAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default);
    Task<StudentAttendance?> GetStudentAttendanceAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default);
    Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default);
    Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(Guid studentId, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
