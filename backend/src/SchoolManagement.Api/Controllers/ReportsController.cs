using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Reporting;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = AuthorizationPolicies.ReportingManagement)]
public sealed class ReportsController(SchoolManagementDbContext db, ReportGenerator generator, IPdfReportGenerator pdf) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken) => Ok(new
    {
        students = await db.Students.AsNoTracking().LongCountAsync(cancellationToken),
        staff = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken),
        programmes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken),
        courses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken),
        academicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(cancellationToken),
        currentAcademicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(x => x.IsCurrent, cancellationToken),
        activeLibraryBooks = await db.LibraryBooks.AsNoTracking().LongCountAsync(x => x.IsActive, cancellationToken),
        activeLibraryLoans = await db.LibraryLoans.AsNoTracking().LongCountAsync(x => x.ReturnedAtUtc == null, cancellationToken)
    });

    [HttpGet("finance")]
    public async Task<IActionResult> GetFinanceSummary(CancellationToken cancellationToken)
    {
        var invoiced = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var paid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        return Ok(new { invoiceCount = await db.StudentInvoices.AsNoTracking().LongCountAsync(cancellationToken), paymentCount = await db.Payments.AsNoTracking().LongCountAsync(cancellationToken), totalInvoiced = invoiced, totalPaid = paid, outstanding = invoiced - paid });
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendanceSummary(CancellationToken cancellationToken) => Ok(new
    {
        sessions = await db.AttendanceSessions.AsNoTracking().LongCountAsync(cancellationToken),
        studentAttendanceRecords = await db.StudentAttendances.AsNoTracking().LongCountAsync(cancellationToken),
        attendanceRecords = await db.AttendanceRecords.AsNoTracking().LongCountAsync(cancellationToken)
    });

    [HttpGet("academic")]
    public async Task<IActionResult> GetAcademicSummary(CancellationToken cancellationToken) => Ok(new
    {
        academicYears = await db.AcademicYears.AsNoTracking().LongCountAsync(cancellationToken),
        semesters = await db.Semesters.AsNoTracking().LongCountAsync(cancellationToken),
        programmes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken),
        courses = await db.Courses.AsNoTracking().LongCountAsync(cancellationToken),
        registrations = await db.CourseRegistrations.AsNoTracking().LongCountAsync(cancellationToken),
        results = await db.Results.AsNoTracking().LongCountAsync(cancellationToken)
    });

    [HttpGet("student/{studentId:guid}/report-card")]
    public async Task<IActionResult> GetStudentReportCard(Guid studentId, [FromQuery] Guid? academicYearId, [FromQuery] Guid? semesterId, CancellationToken cancellationToken)
    {
        var report = await generator.GenerateStudentReportCardAsync(studentId, academicYearId, semesterId, cancellationToken);
        return report is null ? NotFound() : Ok(report);
    }

    [HttpGet("student/{studentId:guid}/report-card/pdf")]
    public async Task<IActionResult> DownloadReportCardPdf(Guid studentId, [FromQuery] Guid? academicYearId, [FromQuery] Guid? semesterId, CancellationToken cancellationToken)
    {
        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == studentId, cancellationToken);
        if (student is null) return NotFound();

        var profile = new SchoolManagement.Infrastructure.Reporting.StudentPortalProfile(student.Id, student.StudentNumber, $"{student.FirstName} {student.LastName}".Trim(), student.Status, student.FirstName, student.LastName, student.OtherNames, student.DateOfBirth, student.Gender, student.NationalId, student.PhoneNumber, student.Email, student.CreatedAt, student.AdmissionId);
        var entries = await db.TranscriptEntries.AsNoTracking().Where(x => x.StudentId == studentId).Where(x => !academicYearId.HasValue || x.AcademicYearId == academicYearId.Value).Where(x => !semesterId.HasValue || x.SemesterId == semesterId.Value).OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId).ThenBy(x => x.CourseCode).ToListAsync(cancellationToken);
        var summaries = await db.AcademicResultSummaries.AsNoTracking().Where(x => x.StudentId == studentId).Where(x => !academicYearId.HasValue || x.AcademicYearId == academicYearId.Value).Where(x => !semesterId.HasValue || x.SemesterId == semesterId.Value).OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId).ToListAsync(cancellationToken);
        var latest = summaries.FirstOrDefault() ?? throw new InvalidOperationException("No summary available.");
        var bytes = pdf.GenerateReportCardPdf(profile, latest, entries);
        return File(bytes, "application/pdf", $"report-card-{student.StudentNumber}.pdf");
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
        return Ok(await generator.GenerateAttendanceReportAsync(classId, (from, to), cancellationToken));
    }

    [HttpGet("financial/statement")]
    public async Task<IActionResult> GetFinancialStatement([FromQuery] string? period, CancellationToken cancellationToken) => Ok(await generator.GenerateFinancialStatementAsync(period, cancellationToken));
}
