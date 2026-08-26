using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Reporting;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController(SchoolManagementDbContext db, ReportGenerator generator) : ControllerBase
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

    [HttpGet("student/{studentId:guid}/report-card")]
    public async Task<IActionResult> GetStudentReportCard(Guid studentId, [FromQuery] Guid? academicYearId, [FromQuery] Guid? semesterId, CancellationToken cancellationToken)
    {
        var report = await generator.GenerateStudentReportCardAsync(studentId, academicYearId, semesterId, cancellationToken);
        return report is null ? NotFound() : Ok(report);
    }

    [HttpGet("payment/{paymentId:guid}/receipt")]
    public async Task<IActionResult> GetPaymentReceipt(Guid paymentId, CancellationToken cancellationToken)
    {
        var receipt = await generator.GenerateFeeReceiptAsync(paymentId, cancellationToken);
        return receipt is null ? NotFound() : Ok(receipt);
    }

    [HttpGet("attendance/class/{classId:guid}")]
    public async Task<IActionResult> GetClassAttendanceReport(Guid classId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken cancellationToken)
    {
        var from = fromDate ?? DateOnly.MinValue;
        var to = toDate ?? DateOnly.MaxValue;
        var report = await generator.GenerateAttendanceReportAsync(classId, (from, to), cancellationToken);
        return Ok(report);
    }

    [HttpGet("financial/statement")]
    public async Task<IActionResult> GetFinancialStatement([FromQuery] string? period, CancellationToken cancellationToken)
    {
        var statement = await generator.GenerateFinancialStatementAsync(period, cancellationToken);
        return Ok(statement);
    }

    [HttpGet("finance/daily-collection/{collectionId:guid}")]
    public async Task<IActionResult> GetDailyCollectionReport(Guid collectionId, CancellationToken cancellationToken)
    {
        var collection = await db.DailyCollections.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == collectionId, cancellationToken);
        if (collection == null) return NotFound();

        var payments = await db.DailyCollectionPayments.AsNoTracking()
            .Where(x => x.DailyCollectionId == collectionId)
            .ToListAsync(cancellationToken);

        return Ok(new { collection, payments });
    }

    [HttpGet("finance/outstanding-by-programme")]
    public async Task<IActionResult> GetOutstandingByProgramme(CancellationToken cancellationToken)
    {
        var data = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .GroupBy(x => new { x.FeeStructure.ProgrammeId, ProgrammeName = x.FeeStructure.Name })
            .Select(g => new
            {
                g.Key.ProgrammeId,
                g.Key.ProgrammeName,
                StudentCount = g.Select(x => x.StudentId).Distinct().Count(),
                TotalOutstanding = g.Sum(x => x.Amount - x.PaidAmount),
                Currency = g.FirstOrDefault()?.Currency ?? "UGX"
            })
            .ToListAsync(cancellationToken);

        return Ok(data);
    }

    [HttpGet("integration/schoolpay/status")]
    public async Task<IActionResult> GetSchoolPayIntegrationStatus(CancellationToken cancellationToken)
    {
        return Ok(new
        {
            integrated = false,
            provider = "SchoolPay",
            status = "Placeholder",
            message = "SchoolPay integration is not configured. This endpoint is a placeholder for future integration."
        });
    }

    [HttpPost("integration/schoolpay/sync")]
    public async Task<IActionResult> SyncSchoolPay(CancellationToken cancellationToken)
    {
        return Ok(new
        {
            success = false,
            message = "SchoolPay sync is not configured. This endpoint is a placeholder for future integration."
        });
    }
}
