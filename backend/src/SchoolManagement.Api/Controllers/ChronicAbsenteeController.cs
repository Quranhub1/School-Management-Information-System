using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance/chronic")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class ChronicAbsenteeController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("report")]
    public async Task<IActionResult> GetChronicAbsenteeReport([FromQuery] int thresholdDays = 10, [FromQuery] int periodDays = 30, CancellationToken cancellationToken = default)
    {
        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-periodDays));
        var absences = await db.StudentAttendances.AsNoTracking()
            .Join(db.AttendanceSessions.AsNoTracking(), sa => sa.AttendanceSessionId, s => s.Id, (sa, s) => new { sa, s })
            .Where(x => x.sa.Status == "Absent" && x.s.SessionDate >= fromDate)
            .GroupBy(x => x.sa.StudentId)
            .Select(g => new
            {
                StudentId = g.Key,
                AbsenceCount = g.Count(),
                TotalSessions = db.StudentAttendances.Count(sa => sa.StudentId == g.Key && sa.AttendanceSession.SessionDate >= fromDate),
                AbsenceRate = (double)g.Count() / db.StudentAttendances.Count(sa => sa.StudentId == g.Key && sa.AttendanceSession.SessionDate >= fromDate)
            })
            .Where(x => x.AbsenceCount >= thresholdDays)
            .OrderByDescending(x => x.AbsenceRate)
            .ThenByDescending(x => x.AbsenceCount)
            .ToListAsync(cancellationToken);

        var studentIds = absences.Select(x => x.StudentId).Distinct().ToList();
        var students = await db.Students.AsNoTracking().Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StudentNumber, s.FirstName, s.LastName, s.OtherNames, s.PhoneNumber }).ToListAsync(cancellationToken);

        var result = absences.Select(a =>
        {
            var student = students.FirstOrDefault(s => s.Id == a.StudentId);
            return new { a.StudentId, studentNumber = student?.StudentNumber,
                studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
                phoneNumber = student?.PhoneNumber, a.AbsenceCount, a.TotalSessions,
                absenceRate = Math.Round(a.AbsenceRate * 100, 1), isChronic = a.AbsenceRate > 0.3 };
        }).ToList();
        return Ok(result);
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAbsenteeAlerts([FromQuery] int periodDays = 30, CancellationToken cancellationToken = default)
    {
        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-periodDays));
        var absences = await db.StudentAttendances.AsNoTracking()
            .Join(db.AttendanceSessions.AsNoTracking(), sa => sa.AttendanceSessionId, s => s.Id, (sa, s) => new { sa, s })
            .Where(x => x.sa.Status == "Absent" && x.s.SessionDate >= fromDate)
            .GroupBy(x => x.sa.StudentId)
            .Select(g => new { StudentId = g.Key, AbsenceCount = g.Count(), TotalSessions = db.StudentAttendances.Count(sa => sa.StudentId == g.Key && sa.AttendanceSession.SessionDate >= fromDate) })
            .Where(x => x.AbsenceCount >= 5).ToListAsync(cancellationToken);

        var studentIds = absences.Select(x => x.StudentId).Distinct().ToList();
        var students = await db.Students.AsNoTracking().Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StudentNumber, s.FirstName, s.LastName, s.OtherNames, s.PhoneNumber }).ToListAsync(cancellationToken);
        var alerts = absences.Select(a =>
        {
            var student = students.FirstOrDefault(s => s.Id == a.StudentId);
            var rate = a.TotalSessions > 0 ? (double)a.AbsenceCount / a.TotalSessions : 0;
            return new { a.StudentId, studentNumber = student?.StudentNumber,
                studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
                phoneNumber = student?.PhoneNumber, a.AbsenceCount, absenceRate = Math.Round(rate * 100, 1),
                severity = rate > 0.3 ? "Critical" : rate > 0.15 ? "Warning" : "Low",
                suggestedAction = rate > 0.3 ? "Schedule parent meeting" : rate > 0.15 ? "Send SMS to parent" : "Monitor closely" };
        }).OrderByDescending(a => a.absenceRate).ToList();
        return Ok(alerts);
    }
}
