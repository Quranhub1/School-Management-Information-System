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
        if (thresholdDays < 1 || periodDays < 1) return BadRequest(new { message = "Threshold and period must be positive." });
        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-periodDays));
        var grouped = await (
            from attendance in db.StudentAttendances.AsNoTracking()
            join session in db.AttendanceSessions.AsNoTracking() on attendance.AttendanceSessionId equals session.Id
            where session.SessionDate >= fromDate
            group attendance by attendance.StudentId into g
            select new
            {
                StudentId = g.Key,
                AbsenceCount = g.Count(x => x.Status == "Absent"),
                TotalSessions = g.Count()
            })
            .Where(x => x.AbsenceCount >= thresholdDays)
            .ToListAsync(cancellationToken);

        var studentIds = grouped.Select(x => x.StudentId).ToList();
        var students = await db.Students.AsNoTracking().Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StudentNumber, s.FirstName, s.LastName, s.OtherNames, s.PhoneNumber }).ToListAsync(cancellationToken);
        var result = grouped.Select(a =>
        {
            var student = students.FirstOrDefault(s => s.Id == a.StudentId);
            var rate = a.TotalSessions > 0 ? (double)a.AbsenceCount / a.TotalSessions : 0d;
            return new { a.StudentId, studentNumber = student?.StudentNumber, studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(), phoneNumber = student?.PhoneNumber, a.AbsenceCount, a.TotalSessions, absenceRate = Math.Round(rate * 100, 1), isChronic = rate > 0.3 };
        }).OrderByDescending(x => x.absenceRate).ThenByDescending(x => x.AbsenceCount).ToList();
        return Ok(result);
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetAbsenteeAlerts([FromQuery] int periodDays = 30, CancellationToken cancellationToken = default)
    {
        if (periodDays < 1) return BadRequest(new { message = "Period must be positive." });
        var fromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-periodDays));
        var grouped = await (
            from attendance in db.StudentAttendances.AsNoTracking()
            join session in db.AttendanceSessions.AsNoTracking() on attendance.AttendanceSessionId equals session.Id
            where session.SessionDate >= fromDate
            group attendance by attendance.StudentId into g
            select new { StudentId = g.Key, AbsenceCount = g.Count(x => x.Status == "Absent"), TotalSessions = g.Count() }
        ).Where(x => x.AbsenceCount >= 5).ToListAsync(cancellationToken);

        var studentIds = grouped.Select(x => x.StudentId).ToList();
        var students = await db.Students.AsNoTracking().Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StudentNumber, s.FirstName, s.LastName, s.OtherNames, s.PhoneNumber }).ToListAsync(cancellationToken);
        var alerts = grouped.Select(a =>
        {
            var student = students.FirstOrDefault(s => s.Id == a.StudentId);
            var rate = a.TotalSessions > 0 ? (double)a.AbsenceCount / a.TotalSessions : 0d;
            return new { a.StudentId, studentNumber = student?.StudentNumber, studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(), phoneNumber = student?.PhoneNumber, a.AbsenceCount, absenceRate = Math.Round(rate * 100, 1), severity = rate > 0.3 ? "Critical" : rate > 0.15 ? "Warning" : "Low", suggestedAction = rate > 0.3 ? "Schedule parent meeting" : rate > 0.15 ? "Send SMS to parent" : "Monitor closely" };
        }).OrderByDescending(a => a.absenceRate).ToList();
        return Ok(alerts);
    }
}
