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
        var totalStudents = await db.Students.LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.LongCountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.LongCountAsync(cancellationToken);
        var totalCourses = await db.Courses.LongCountAsync(cancellationToken);
        var totalInvoices = await db.StudentInvoices.LongCountAsync(cancellationToken);
        var outstandingInvoices = await db.StudentInvoices.LongCountAsync(x => x.OutstandingAmount > 0, cancellationToken);
        var invoiced = await db.StudentInvoices.SumAsync(x => (decimal?)x.NetAmount, cancellationToken) ?? 0m;
        var paid = await db.StudentInvoices.SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        var pendingAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Pending", cancellationToken);
        var acceptedAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Accepted", cancellationToken);
        var rejectedAdmissions = await db.Admissions.LongCountAsync(x => x.Status == "Rejected", cancellationToken);
        var totalResults = await db.Results.LongCountAsync(cancellationToken);
        var passedResults = await db.Results.LongCountAsync(x => x.Score.HasValue && x.Score.Value >= 50, cancellationToken);
        var failedResults = totalResults - passedResults;
        var attendanceSessions = await db.AttendanceSessions.LongCountAsync(cancellationToken);
        var studentAttendanceRecords = await db.StudentAttendances.LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.LongCountAsync(cancellationToken);
        var absentRecords = await db.AttendanceRecords.LongCountAsync(x => x.Status == "Absent", cancellationToken);
        var pendingPayroll = await db.PayrollRecords.LongCountAsync(x => x.Status == "Pending", cancellationToken);
        var paidPayroll = await db.PayrollRecords.LongCountAsync(x => x.Status == "Paid", cancellationToken);

        var recentAdmissions = await db.Admissions.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(10)
            .Select(x => new { x.Id, x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.Status, x.CreatedAt }).ToListAsync(cancellationToken);
        var outstandingBalances = await (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            join fee in db.FeeStructures.AsNoTracking() on invoice.FeeStructureId equals fee.Id into fees
            from fee in fees.DefaultIfEmpty()
            where invoice.OutstandingAmount > 0
            orderby invoice.OutstandingAmount descending
            select new { studentId = student.Id, studentNumber = student.StudentNumber, studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName, balance = invoice.OutstandingAmount, invoice.Currency, programmeName = fee == null ? invoice.FeeType : fee.Name }
        ).Take(20).ToListAsync(cancellationToken);
        var recentPayments = await (
            from payment in db.Payments.AsNoTracking()
            join student in db.Students.AsNoTracking() on payment.StudentId equals student.Id
            join invoice in db.StudentInvoices.AsNoTracking() on payment.StudentInvoiceId equals invoice.Id into invoices
            from invoice in invoices.DefaultIfEmpty()
            orderby payment.PaidAt descending
            select new { payment.Id, payment.ReceiptNumber, payment.Amount, payment.PaymentMethod, payment.PaidAt, studentName = student.FirstName + " " + student.LastName, invoiceNumber = invoice == null ? null : invoice.InvoiceNumber }
        ).Take(20).ToListAsync(cancellationToken);
        var recentResults = await (
            from result in db.Results.AsNoTracking()
            join student in db.Students.AsNoTracking() on result.StudentId equals student.Id
            orderby result.Id descending
            select new { result.Id, studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName, result.Score, result.Grade, passed = result.Score.HasValue && result.Score.Value >= 50 }
        ).Take(10).ToListAsync(cancellationToken);

        return Ok(new { totalStudents, activeStudents, totalStaff, totalProgrammes, totalCourses, totalInvoices, outstandingInvoices, totalInvoiced = invoiced, totalPaid = paid, pendingAdmissions, acceptedAdmissions, rejectedAdmissions, totalResults, passedResults, failedResults, attendanceSessions, studentAttendanceRecords, attendanceRecords, absentRecords, pendingPayroll, paidPayroll, recentAdmissions, outstandingBalances, recentPayments, recentResults });
    }

    [HttpGet("staff-performance")]
    public async Task<IActionResult> GetStaffPerformance(CancellationToken cancellationToken)
    {
        var data = await db.StaffMembers.AsNoTracking().Select(s => new
        {
            s.Id, s.StaffNumber, s.FirstName, s.LastName, s.DepartmentId, s.StaffType, s.EmploymentStatus, s.IsActive,
            classCount = db.TimetableEntries.Count(t => t.StaffMemberId == s.Id),
            teachingAllocations = db.TeachingAllocations.Count(t => t.StaffMemberId == s.Id)
        }).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpGet("departmental-summary")]
    public async Task<IActionResult> GetDepartmentalSummary(CancellationToken cancellationToken)
    {
        var departments = await db.Departments.AsNoTracking().Select(d => new
        {
            d.Id, d.Name,
            programmeCount = db.Programmes.Count(p => p.DepartmentId == d.Id),
            staffCount = db.StaffMembers.Count(s => s.DepartmentId == d.Id),
            studentCount = (from enrollment in db.StudentEnrollments join programme in db.Programmes on enrollment.ProgrammeId equals programme.Id join student in db.Students on enrollment.StudentId equals student.Id where programme.DepartmentId == d.Id select student.Id).Distinct().Count()
        }).ToListAsync(cancellationToken);
        return Ok(departments);
    }
}
