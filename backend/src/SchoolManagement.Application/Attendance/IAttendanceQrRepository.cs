using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

public interface IAttendanceQrRepository
{
    Task<AttendanceQrSession?> GetByTokenAsync(string qrToken, CancellationToken cancellationToken = default);
    Task<AttendanceQrSession?> GetActiveBySessionAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default);
    Task AddAsync(AttendanceQrSession qrSession, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
