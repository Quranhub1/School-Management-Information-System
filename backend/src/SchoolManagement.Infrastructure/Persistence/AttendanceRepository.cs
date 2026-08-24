using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class AttendanceRepository(SchoolManagementDbContext db) : IAttendanceRepository
{
    public Task<AttendanceSession?> GetSessionAsync(Guid timetableEntryId, DateOnly sessionDate, CancellationToken cancellationToken = default) =>
        db.AttendanceSessions.FirstOrDefaultAsync(x => x.TimetableEntryId == timetableEntryId && x.SessionDate == sessionDate, cancellationToken);

    public Task<StudentAttendance?> GetStudentAttendanceAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default) =>
        db.StudentAttendances.FirstOrDefaultAsync(x => x.AttendanceSessionId == attendanceSessionId && x.StudentId == studentId, cancellationToken);

    public async Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default) =>
        await db.AttendanceSessions.AddAsync(session, cancellationToken);

    public async Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default) =>
        await db.StudentAttendances.AddAsync(attendance, cancellationToken);

    public async Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(Guid studentId, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.StudentAttendances
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .Join(db.AttendanceSessions.AsNoTracking(),
                record => record.AttendanceSessionId,
                session => session.Id,
                (record, session) => new { record, session });

        if (from.HasValue)
            query = query.Where(x => x.session.SessionDate >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.session.SessionDate <= to.Value);

        return await query
            .OrderByDescending(x => x.session.SessionDate)
            .Select(x => x.record)
            .ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
