using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/principal")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class PrincipalController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var totalStudents = await db.Students.AsNoTracking().LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.AsNoTracking().CountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken);
        var totalCourses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken);
        var totalInvoices = await db.StudentInvoices.AsNoTracking().LongCountAsync(cancellationToken);
        var outstandingInvoices = await db.StudentInvoices.AsNoTracking().CountAsync(x => x.PaidAmount < x.Amount, cancellationToken);
        var invoiced = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var paid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;

        var pendingAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Pending", cancellationToken);
        var acceptedAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Accepted", cancellationToken);
        var rejectedAdmissions = await db.Admissions.AsNoTracking().CountAsync(x => x.Status == "Rejected", cancellationToken);

        var totalResults = await db.Results.AsNoTracking().LongCountAsync(cancellationToken);
        var passedResults = await db.Results.AsNoTracking().CountAsync(x => x.Score >= 50, cancellationToken);
        var failedResults = totalResults - passedResults;

        var attendanceSessions = await db.AttendanceSessions.AsNoTracking().LongCountAsync(cancellationToken);
        var studentAttendanceRecords = await db.StudentAttendances.AsNoTracking().LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.AsNoTracking().LongCountAsync(cancellationToken);
        var absentRecords = await db.AttendanceRecords.AsNoTracking().CountAsync(x => x.Status == "Absent", cancellationToken);

        var pendingPayroll = await db.PayrollRecords.AsNoTracking().CountAsync(x => x.Status == "Pending", cancellationToken);
        var paidPayroll = await db.PayrollRecords.AsNoTracking().CountAsync(x => x.Status == "Paid", cancellationToken);

        var recentAdmissions = await db.Admissions.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .Select(x => new { x.Id, x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.Status, x.CreatedAt })
            .ToListAsync(cancellationToken);

        var outstandingBalances = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .OrderByDescending(x => x.Amount - x.PaidAmount)
            .Take(20)
            .Select(x => new
            {
                studentId = x.StudentId,
                studentNumber = x.Student.StudentNumber,
                studentName = x.Student.FirstName + " " + x.Student.OtherNames + " " + x.Student.LastName,
                balance = x.Amount - x.PaidAmount,
                currency = x.Currency,
                programmeName = x.FeeStructure.Name
            })
            .ToListAsync(cancellationToken);

        var recentPayments = await db.Payments.AsNoTracking()
            .OrderByDescending(p => p.PaidAt)
            .Take(20)
            .Select(p => new
            {
                p.Id,
                p.ReceiptNumber,
                p.Amount,
                p.PaymentMethod,
                p.PaidAt,
                studentName = p.StudentInvoice.Student.FirstName + " " + p.StudentInvoice.Student.OtherNames + " " + p.StudentInvoice.Student.LastName,
                invoiceNumber = p.StudentInvoice.InvoiceNumber
            })
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

        return Ok(new
        {
            totalStudents,
            activeStudents,
            totalStaff,
            totalProgrammes,
            totalCourses,
            totalInvoices,
            outstandingInvoices,
            totalInvoiced = invoiced,
            totalPaid = paid,
            pendingAdmissions,
            acceptedAdmissions,
            rejectedAdmissions,
            totalResults,
            passedResults,
            failedResults,
            attendanceSessions,
            studentAttendanceRecords,
            attendanceRecords,
            absentRecords,
            pendingPayroll,
            paidPayroll,
            recentAdmissions,
            outstandingBalances,
            recentPayments,
            recentResults
        });
    }

    [HttpGet("staff-performance")]
    public async Task<IActionResult> GetStaffPerformance(CancellationToken cancellationToken)
    {
        var staffPerformance = await db.StaffMembers.AsNoTracking()
            .Select(s => new
            {
                s.Id,
                s.StaffNumber,
                s.FirstName,
                s.LastName,
                s.Department,
                s.Position,
                s.Status,
                classCount = db.TimetableEntries.Count(t => t.StaffMemberId == s.Id),
                studentCount = db.StudentAttendances.Count(a => a.RecordedBy == s.Id.ToString()),
                resultCount = db.Results.Count(r => r.RecordedBy == s.Id.ToString())
            })
            .ToListAsync(cancellationToken);

        return Ok(staffPerformance);
    }

    [HttpGet("departmental-summary")]
    public async Task<IActionResult> GetDepartmentalSummary(CancellationToken cancellationToken)
    {
        var departments = await db.Departments.AsNoTracking()
            .Select(d => new
            {
                d.Id,
                d.Name,
                programmeCount = db.Programmes.Count(p => p.DepartmentId == d.Id),
                staffCount = db.StaffMembers.Count(s => s.Department == d.Name),
                studentCount = db.Students.Count(st => st.DepartmentId == d.Id)
            })
            .ToListAsync(cancellationToken);

        return Ok(departments);
    }
}