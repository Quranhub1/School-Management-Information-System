using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AttendanceRepository(SchoolManagementDbContext db) : IAttendanceRepository, SchoolManagement.Application.Attendance.IAttendanceRepository
{
    public Task<AttendanceSession?> GetSessionAsync(Guid timetableEntryId, DateOnly sessionDate, CancellationToken cancellationToken = default) =>
        db.AttendanceSessions.FirstOrDefaultAsync(
            x => x.TimetableEntryId == timetableEntryId && x.SessionDate == sessionDate,
            cancellationToken);

    public Task<AttendanceSession?> GetSessionByIdAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default) =>
        db.AttendanceSessions.FirstOrDefaultAsync(x => x.Id == attendanceSessionId, cancellationToken);

    public Task<bool> IsStudentEligibleForSessionAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default) =>
        db.AttendanceSessions
            .Where(session => session.Id == attendanceSessionId)
            .Join(
                db.TimetableEntries,
                session => session.TimetableEntryId,
                timetable => timetable.Id,
                (session, timetable) => timetable)
            .Join(
                db.TeachingGroups,
                timetable => timetable.TeachingGroupId,
                group => group.Id,
                (timetable, group) => group)
            .Join(
                db.CourseOfferings,
                group => group.CourseOfferingId,
                offering => offering.Id,
                (group, offering) => offering)
            .Join(
                db.CourseRegistrations,
                offering => new { offering.CourseId, offering.SemesterId },
                registration => new { registration.CourseId, registration.SemesterId },
                (offering, registration) => registration)
            .AnyAsync(
                registration => registration.StudentId == studentId
                    && (registration.Status == "Registered" || registration.Status == "Active"),
                cancellationToken);

    public Task<StudentAttendance?> GetStudentAttendanceAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default) =>
        db.StudentAttendances.FirstOrDefaultAsync(
            x => x.AttendanceSessionId == attendanceSessionId && x.StudentId == studentId,
            cancellationToken);

    public async Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default) =>
        await db.AttendanceSessions.AddAsync(session, cancellationToken);

    public async Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default) =>
        await db.StudentAttendances.AddAsync(attendance, cancellationToken);

    public async Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(
        Guid studentId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.StudentAttendances
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .Join(
                db.AttendanceSessions.AsNoTracking(),
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

    public async Task<IReadOnlyList<EligibleStudentDto>> GetEligibleStudentsAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default)
    {
        var session = await db.AttendanceSessions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        // Get the course ID from the timetable entry
        var courseId = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.Id == session.TimetableEntryId)
            .Select(x => x.CourseId)
            .FirstOrDefaultAsync(cancellationToken);

        // Get active registrations for that course
        var registeredStudentIds = await db.CourseRegistrations.AsNoTracking()
            .Where(x => x.CourseId == courseId
                && (x.Status == "Registered" || x.Status == "Active"))
            .Select(x => x.StudentId)
            .ToListAsync(cancellationToken);

        var enrolled = await db.Students.AsNoTracking()
            .Where(x => registeredStudentIds.Contains(x.Id) && !x.IsArchived)
            .Select(x => new EligibleStudentDto(
                x.Id,
                x.StudentNumber,
                x.FirstName,
                x.LastName,
                x.OtherNames,
                x.DisplayName,
                x.CampusId?.ToString() ?? string.Empty,
                false))
            .ToListAsync(cancellationToken);

        var marked = await db.StudentAttendances.AsNoTracking()
            .Where(x => x.AttendanceSessionId == attendanceSessionId)
            .Select(x => x.StudentId)
            .ToListAsync(cancellationToken);

        return enrolled.Select(e => e with { AlreadyMarked = marked.Contains(e.StudentId) }).ToList();
    }

    public async Task<SessionSummaryDto> GetSessionSummaryAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default)
    {
        var session = await db.AttendanceSessions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == attendanceSessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Attendance session was not found.");

        var totalEnrolled = await (
            from registration in db.CourseRegistrations.AsNoTracking()
            where registration.CourseId == (
                from timetable in db.TimetableEntries.AsNoTracking()
                where timetable.Id == session.TimetableEntryId
                select timetable.CourseId
            ).FirstOrDefault()
            && registration.SemesterId == (
                from offering in db.CourseOfferings.AsNoTracking()
                join timetable in db.TimetableEntries.AsNoTracking() on offering.Id equals timetable.TeachingGroupId
                where timetable.Id == session.TimetableEntryId
                select offering.SemesterId
            ).FirstOrDefault()
            && (registration.Status == "Registered" || registration.Status == "Active")
            select registration
        ).CountAsync(cancellationToken);

        var records = await db.StudentAttendances.AsNoTracking()
            .Where(x => x.AttendanceSessionId == attendanceSessionId)
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var markedPresent = records.FirstOrDefault(r => r.Status == AttendanceStatus.Present)?.Count ?? 0;
        var markedAbsent = records.FirstOrDefault(r => r.Status == AttendanceStatus.Absent)?.Count ?? 0;
        var markedLate = records.FirstOrDefault(r => r.Status == AttendanceStatus.Late)?.Count ?? 0;
        var markedExcused = records.FirstOrDefault(r => r.Status == AttendanceStatus.Excused)?.Count ?? 0;
        var markedTotal = markedPresent + markedAbsent + markedLate + markedExcused;
        var unmarked = totalEnrolled - markedTotal;
        var percentage = totalEnrolled > 0 ? Math.Round((double)markedTotal / totalEnrolled * 100, 1) : 0;

        return new SessionSummaryDto(
            session.Id,
            session.TimetableEntryId,
            session.SessionDate,
            session.Status,
            totalEnrolled,
            markedPresent,
            markedAbsent,
            markedLate,
            markedExcused,
            unmarked,
            percentage);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
