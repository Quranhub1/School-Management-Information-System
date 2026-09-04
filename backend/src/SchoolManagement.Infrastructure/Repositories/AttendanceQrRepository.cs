using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AttendanceQrRepository(SchoolManagementDbContext db) : IAttendanceQrRepository
{
    public Task<AttendanceQrSession?> GetByTokenAsync(string qrToken, CancellationToken cancellationToken = default) =>
        db.AttendanceQrSessions.SingleOrDefaultAsync(x => x.QrToken == qrToken, cancellationToken);

    public Task<AttendanceQrSession?> GetActiveBySessionAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default) =>
        db.AttendanceQrSessions
            .Where(x => x.AttendanceSessionId == attendanceSessionId && !x.IsUsed && x.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(x => x.GeneratedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task AddAsync(AttendanceQrSession qrSession, CancellationToken cancellationToken = default) => await db.AttendanceQrSessions.AddAsync(qrSession, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
