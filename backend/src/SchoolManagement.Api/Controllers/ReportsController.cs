using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var report = new
        {
            students = await db.Students.AsNoTracking().LongCountAsync(cancellationToken),
            staff = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken),
            programmes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken),
            courses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken),
            academicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(cancellationToken),
            currentAcademicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(x => x.IsCurrent, cancellationToken),
            activeLibraryBooks = await db.LibraryBooks.AsNoTracking().LongCountAsync(x => x.IsActive, cancellationToken),
            activeLibraryLoans = await db.LibraryLoans.AsNoTracking().LongCountAsync(x => x.ReturnedAtUtc == null, cancellationToken)
        };

        return Ok(report);
    }

    [HttpGet("finance")]
    public async Task<IActionResult> GetFinanceSummary(CancellationToken cancellationToken)
    {
        var invoiced = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var paid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;

        return Ok(new
        {
            invoiceCount = await db.StudentInvoices.AsNoTracking().LongCountAsync(cancellationToken),
            paymentCount = await db.Payments.AsNoTracking().LongCountAsync(cancellationToken),
            totalInvoiced = invoiced,
            totalPaid = paid,
            outstanding = invoiced - paid
        });
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendanceSummary(CancellationToken cancellationToken)
    {
        return Ok(new
        {
            sessions = await db.AttendanceSessions.AsNoTracking().LongCountAsync(cancellationToken),
            studentAttendanceRecords = await db.StudentAttendances.AsNoTracking().LongCountAsync(cancellationToken),
            attendanceRecords = await db.AttendanceRecords.AsNoTracking().LongCountAsync(cancellationToken)
        });
    }

    [HttpGet("academic")]
    public async Task<IActionResult> GetAcademicSummary(CancellationToken cancellationToken)
    {
        return Ok(new
        {
            academicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(cancellationToken),
            semesters = await db.Semesters.AsNoTracking().LongCountAsync(cancellationToken),
            programmes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken),
            courses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken),
            registrations = await db.CourseRegistrations.AsNoTracking().LongCountAsync(cancellationToken),
            results = await db.Results.AsNoTracking().LongCountAsync(cancellationToken)
        });
    }
}
