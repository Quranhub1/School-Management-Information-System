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
        var totalStudents = await db.Students.AsNoTracking().LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.AsNoTracking().CountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken);
        var totalCourses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken);

        var pendingAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Pending", cancellationToken);
        var acceptedAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Accepted", cancellationToken);
        var rejectedAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Rejected", cancellationToken);

        var totalResults = await db.Results.AsNoTracking().LongCountAsync(cancellationToken);
        var passedResults = await db.Results.AsNoTracking().CountAsync(x => x.Score >= 50, cancellationToken);
        var failedResults = totalResults - passedResults;

        var attendanceSessions = await db.AttendanceSessions.AsNoTracking().LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.AsNoTracking().LongCountAsync(cancellationToken);
        var absentRecords = await db.AttendanceRecords.AsNoTracking().CountAsync(x => x.Status == "Absent", cancellationToken);

        var timetableEntries = await db.TimetableEntries.AsNoTracking().LongCountAsync(cancellationToken);
        var timetableConflicts = await db.TimetableEntries.AsNoTracking()
            .GroupBy(t => new { t.Day, t.Period })
            .Where(g => g.Count() > 1)
            .LongCountAsync(cancellationToken);

        var recentAdmissions = await db.Admissions.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .Select(x => new { x.Id, x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.Status, x.CreatedAt })
            .ToListAsync(cancellationToken);

        var recentResults = await db.Results.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new
            {
                r.Id,
                studentName = r.Student.FirstName + " " + r.Student.OtherNames + " " + r.Student.LastName,
                r.Score,
                r.Grade,
                passed = r.Score >= 50
            })
            .ToListAsync(cancellationToken);

        var staffPerformance = await db.StaffMembers.AsNoTracking()
            .Where(s => s.Position.Contains("Lecturer") || s.Position.Contains("Teacher") || s.Position.Contains("Instructor"))
            .Select(s => new
            {
                s.Id,
                s.StaffNumber,
                s.FirstName,
                s.LastName,
                s.Department,
                s.Position,
                classCount = db.TimetableEntries.Count(t => t.StaffMemberId == s.Id),
                resultCount = db.Results.Count(r => r.RecordedBy == s.Id.ToString())
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            totalStudents,
            activeStudents,
            totalStaff,
            totalProgrammes,
            totalCourses,
            pendingAdmissions,
            acceptedAdmissions,
            rejectedAdmissions,
            totalResults,
            passedResults,
            failedResults,
            attendanceSessions,
            attendanceRecords,
            absentRecords,
            timetableEntries,
            timetableConflicts,
            recentAdmissions,
            recentResults,
            staffPerformance
        });
    }

    [HttpGet("academic-performance")]
    public async Task<IActionResult> GetAcademicPerformance(CancellationToken cancellationToken)
    {
        var performance = await db.Programmes.AsNoTracking()
            .Select(p => new
            {
                p.Id,
                p.Name,
                totalStudents = db.Students.Count(s => s.ProgrammeId == p.Id && s.Status == "Active"),
                totalResults = db.Results.Count(r => r.Student.ProgrammeId == p.Id),
                passRate = db.Results.Count(r => r.Student.ProgrammeId == p.Id && r.Score >= 50),
                avgScore = db.Results.Where(r => r.Student.ProgrammeId == p.Id).Average(r => (double?)r.Score) ?? 0
            })
            .ToListAsync(cancellationToken);

        return Ok(performance);
    }

    [HttpGet("examination-summary")]
    public async Task<IActionResult> GetExaminationSummary(CancellationToken cancellationToken)
    {
        var summary = await db.Examinations.AsNoTracking()
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.ExamType,
                e.Status,
                e.StartDate,
                e.EndDate,
                entryCount = db.ExaminationEntries.Count(ex => ex.ExaminationId == e.Id),
                resultCount = db.Results.Count(r => r.ExaminationId == e.Id)
            })
            .OrderByDescending(e => e.StartDate)
            .Take(20)
            .ToListAsync(cancellationToken);

        return Ok(summary);
    }

    [HttpGet("timetable-overview")]
    public async Task<IActionResult> GetTimetableOverview(CancellationToken cancellationToken)
    {
        var timetable = await db.TimetableEntries.AsNoTracking()
            .Include(t => t.StaffMember)
            .Include(t => t.Course)
            .OrderBy(t => t.Day)
            .ThenBy(t => t.Period)
            .Select(t => new
            {
                t.Id,
                t.Day,
                t.Period,
                t.Room,
                staffName = t.StaffMember.FirstName + " " + t.StaffMember.LastName,
                courseName = t.Course.Name
            })
            .ToListAsync(cancellationToken);

        return Ok(timetable);
    }
}