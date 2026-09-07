using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/resident-director")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class ResidentDirectorController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var totalStudents = await db.Students.LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.LongCountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.LongCountAsync(cancellationToken);
        var totalInvoices = await db.StudentInvoices.LongCountAsync(cancellationToken);
        var outstandingInvoices = await db.StudentInvoices.LongCountAsync(x => x.OutstandingAmount > 0, cancellationToken);
        var recentAdmissions = await db.Admissions.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(10).Select(x => new { x.Id, x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.Status, x.CreatedAt }).ToListAsync(cancellationToken);
        var outstandingBalances = await (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            where invoice.OutstandingAmount > 0
            orderby invoice.OutstandingAmount descending
            select new { studentId = student.Id, studentNumber = student.StudentNumber, studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName, balance = invoice.OutstandingAmount, invoice.Currency, invoice.Status }
        ).Take(20).ToListAsync(cancellationToken);
        return Ok(new { totalStudents, activeStudents, totalStaff, totalProgrammes, totalInvoices, outstandingInvoices, recentAdmissions, outstandingBalances });
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents(CancellationToken cancellationToken)
        => Ok(await db.Students.AsNoTracking().OrderByDescending(x => x.CreatedAt).Select(x => new { x.Id, x.StudentNumber, x.FirstName, x.LastName, x.OtherNames, x.Gender, x.Status, x.AdmissionId, createdAt = x.CreatedAt }).ToListAsync(cancellationToken));

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff(CancellationToken cancellationToken)
        => Ok(await db.StaffMembers.AsNoTracking().OrderByDescending(x => x.DateJoined).Select(x => new { x.Id, x.StaffNumber, x.FirstName, x.LastName, x.OtherNames, x.Email, x.PhoneNumber, x.DepartmentId, x.StaffType, x.EmploymentType, x.EmploymentStatus, x.IsActive, x.DateJoined }).ToListAsync(cancellationToken));

    [HttpGet("hostel-status")]
    public IActionResult GetHostelStatus() => Ok(new { totalHouses = 0, totalRooms = 0, totalBeds = 0, occupiedBeds = 0, availableBeds = 0, occupancyRate = 0d, message = "Hostel inventory is not configured in the current domain model." });

    [HttpGet("attendance-summary")]
    public async Task<IActionResult> GetAttendanceSummary(CancellationToken cancellationToken)
    {
        var sessions = await db.AttendanceSessions.LongCountAsync(cancellationToken);
        var studentRecords = await db.StudentAttendances.LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.LongCountAsync(cancellationToken);
        var absentToday = await db.AttendanceRecords.CountAsync(x => x.Status == "Absent" && x.AttendanceDate == DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken);
        return Ok(new { sessions, studentRecords, attendanceRecords, absentToday });
    }

    [HttpGet("welfare-alerts")]
    public async Task<IActionResult> GetWelfareAlerts(CancellationToken cancellationToken)
    {
        var studentsWithLargeBalances = await (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            where invoice.OutstandingAmount > 1000000m
            select new { invoice.StudentId, studentNumber = student.StudentNumber, studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName, balance = invoice.OutstandingAmount, invoice.Currency, alertType = "Large Fee Balance" }
        ).ToListAsync(cancellationToken);
        var absentStudents = await (
            from attendance in db.AttendanceRecords.AsNoTracking()
            join student in db.Students.AsNoTracking() on attendance.StudentId equals student.Id
            where attendance.Status == "Absent"
            orderby attendance.AttendanceDate descending
            select new { attendance.StudentId, studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName, date = attendance.AttendanceDate, alertType = "Absent" }
        ).Take(20).ToListAsync(cancellationToken);
        return Ok(new { studentsWithLargeBalances, absentStudents, totalAlerts = studentsWithLargeBalances.Count + absentStudents.Count });
    }
}
