using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/deputy-principal")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class DeputyPrincipalController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var totalStudents = await db.Students.LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.LongCountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.LongCountAsync(cancellationToken);
        var totalCourses = await db.Courses.LongCountAsync(cancellationToken);
        var pendingAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Pending", cancellationToken);
        var acceptedAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Accepted", cancellationToken);
        var rejectedAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Rejected", cancellationToken);
        var totalResults = await db.Results.LongCountAsync(cancellationToken);
        var passedResults = await db.Results.LongCountAsync(x => x.Score.HasValue && x.Score.Value >= 50, cancellationToken);
        var failedResults = totalResults - passedResults;
        var attendanceSessions = await db.AttendanceSessions.LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.LongCountAsync(cancellationToken);
        var absentRecords = await db.AttendanceRecords.LongCountAsync(x => x.Status == "Absent", cancellationToken);
        var timetableEntries = await db.TimetableEntries.LongCountAsync(x => x.IsActive, cancellationToken);
        var timetableConflicts = await db.TimetableEntries.Where(t => t.IsActive).GroupBy(t => new { t.DayOfWeek, t.StartTime, t.EndTime }).Where(g => g.Count() > 1).LongCountAsync(cancellationToken);
        var recentAdmissions = await db.Admissions.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(10).Select(x => new { x.Id, x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.Status, x.CreatedAt }).ToListAsync(cancellationToken);
        var recentResults = await (
            from result in db.Results.AsNoTracking()
            join student in db.Students.AsNoTracking() on result.StudentId equals student.Id
            orderby result.Id descending
            select new { result.Id, studentName = student.FirstName + " " + student.LastName, result.Score, result.Grade, passed = result.Score.HasValue && result.Score.Value >= 50 }
        ).Take(10).ToListAsync(cancellationToken);
        var staffPerformance = await db.StaffMembers.AsNoTracking().Where(s => s.StaffType == SchoolManagement.Domain.Staff.StaffType.Teaching).Select(s => new { s.Id, s.StaffNumber, s.FirstName, s.LastName, s.DepartmentId, s.StaffType, classCount = db.TimetableEntries.Count(t => t.StaffMemberId == s.Id && t.IsActive), resultCount = 0 }).ToListAsync(cancellationToken);
        return Ok(new { totalStudents, activeStudents, totalStaff, totalProgrammes, totalCourses, pendingAdmissions, acceptedAdmissions, rejectedAdmissions, totalResults, passedResults, failedResults, attendanceSessions, attendanceRecords, absentRecords, timetableEntries, timetableConflicts, recentAdmissions, recentResults, staffPerformance });
    }

    [HttpGet("academic-performance")]
    public async Task<IActionResult> GetAcademicPerformance(CancellationToken cancellationToken)
    {
        var performance = await db.Programmes.AsNoTracking().Select(p => new
        {
            p.Id, p.Name,
            totalStudents = db.StudentEnrollments.Where(e => e.ProgrammeId == p.Id && e.Status == "Active").Select(e => e.StudentId).Distinct().Count(),
            totalResults = (from r in db.Results join e in db.StudentEnrollments on r.StudentId equals e.StudentId where e.ProgrammeId == p.Id select r.Id).Distinct().Count(),
            passCount = (from r in db.Results join e in db.StudentEnrollments on r.StudentId equals e.StudentId where e.ProgrammeId == p.Id && r.Score.HasValue && r.Score.Value >= 50 select r.Id).Distinct().Count(),
            avgScore = (from r in db.Results join e in db.StudentEnrollments on r.StudentId equals e.StudentId where e.ProgrammeId == p.Id select (double?)r.Score).Average() ?? 0
        }).ToListAsync(cancellationToken);
        return Ok(performance.Select(x => new { x.Id, x.Name, x.totalStudents, x.totalResults, x.passCount, passRate = x.totalResults > 0 ? Math.Round((double)x.passCount / x.totalResults * 100, 1) : 0, x.avgScore }));
    }

    [HttpGet("examination-summary")]
    public async Task<IActionResult> GetExaminationSummary(CancellationToken cancellationToken)
    {
        var summary = await (
            from result in db.Results.AsNoTracking()
            join course in db.Courses.AsNoTracking() on result.CourseId equals course.Id
            join semester in db.Semesters.AsNoTracking() on result.SemesterId equals semester.Id
            group result by new { result.CourseId, course.Name, result.SemesterId } into g
            select new { courseId = g.Key.CourseId, courseName = g.Key.Name, semesterId = g.Key.SemesterId, entryCount = g.Count(), resultCount = g.Count(x => x.Score.HasValue), passCount = g.Count(x => x.Score.HasValue && x.Score.Value >= 50) }
        ).OrderByDescending(x => x.resultCount).Take(20).ToListAsync(cancellationToken);
        return Ok(summary);
    }

    [HttpGet("timetable-overview")]
    public async Task<IActionResult> GetTimetableOverview(CancellationToken cancellationToken)
    {
        var timetable = await (
            from entry in db.TimetableEntries.AsNoTracking()
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id into staffJoin
            from staff in staffJoin.DefaultIfEmpty()
            join course in db.Courses.AsNoTracking() on entry.CourseId equals course.Id into courseJoin
            from course in courseJoin.DefaultIfEmpty()
            where entry.IsActive
            orderby entry.DayOfWeek, entry.StartTime
            select new { entry.Id, entry.DayOfWeek, entry.StartTime, entry.EndTime, entry.Room, staffName = staff == null ? null : staff.FirstName + " " + staff.LastName, courseName = course == null ? null : course.Name }
        ).ToListAsync(cancellationToken);
        return Ok(timetable);
    }
}
