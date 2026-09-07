using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

/// <summary>
/// Offline-first modern information-system capabilities: student 360, executive KPIs,
/// predictive risk, global search, workflow summaries and admission document metadata.
/// </summary>
[ApiController]
[Route("api/modern")]
[Authorize]
public sealed class ModernInformationController(SchoolManagementDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ModernDashboardDto>> Dashboard(CancellationToken ct)
    {
        var students = await db.Students.AsNoTracking().ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking().ToListAsync(ct);
        var assessments = await db.StudentAssessments.AsNoTracking().ToListAsync(ct);
        var attendance = await db.StudentAttendances.AsNoTracking().ToListAsync(ct);
        var placements = await db.StudentPlacements.AsNoTracking().ToListAsync(ct);
        var admissions = await db.Admissions.AsNoTracking().ToListAsync(ct);

        var paid = invoices.Sum(x => x.PaidAmount);
        var billed = invoices.Sum(x => x.Amount);
        var present = attendance.Count(x => string.Equals(x.Status, "Present", StringComparison.OrdinalIgnoreCase));
        var attendanceRate = attendance.Count == 0 ? 0 : Math.Round(present * 100m / attendance.Count, 1);
        var averageScore = assessments.Count == 0 ? 0 : Math.Round(assessments.Average(x => x.MaximumScore == 0 ? 0 : x.Score * 100m / x.MaximumScore), 1);
        var placementRate = placements.Count == 0 ? 0 : Math.Round(placements.Count(x => string.Equals(x.Status, "Completed", StringComparison.OrdinalIgnoreCase)) * 100m / placements.Count, 1);

        return Ok(new ModernDashboardDto(
            students.Count,
            students.Count(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase)),
            admissions.Count(x => string.Equals(x.Status, "Pending", StringComparison.OrdinalIgnoreCase)),
            billed,
            paid,
            billed - paid,
            attendanceRate,
            averageScore,
            placementRate,
            DateTimeOffset.UtcNow));
    }

    [HttpGet("students/{studentId:guid}/360")]
    public async Task<ActionResult<Student360Dto>> Student360(Guid studentId, CancellationToken ct)
    {
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentId, ct);
        if (student is null) return NotFound();

        var attendance = await db.StudentAttendances.AsNoTracking().Where(x => x.StudentId == studentId).ToListAsync(ct);
        var assessments = await db.StudentAssessments.AsNoTracking().Where(x => x.StudentId == studentId).ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking().Where(x => x.StudentId == studentId).ToListAsync(ct);
        var placements = await db.StudentPlacements.AsNoTracking().Where(x => x.StudentId == studentId).ToListAsync(ct);
        var certificates = await db.Certificates.AsNoTracking().CountAsync(x => x.StudentId == studentId, ct);

        var present = attendance.Count(x => string.Equals(x.Status, "Present", StringComparison.OrdinalIgnoreCase));
        var attendanceRate = attendance.Count == 0 ? 0 : Math.Round(present * 100m / attendance.Count, 1);
        var score = assessments.Count == 0 ? 0 : Math.Round(assessments.Average(x => x.MaximumScore == 0 ? 0 : x.Score * 100m / x.MaximumScore), 1);
        var billed = invoices.Sum(x => x.Amount);
        var paid = invoices.Sum(x => x.PaidAmount);

        return Ok(new Student360Dto(
            student.Id, student.StudentNumber, $"{student.FirstName} {student.OtherNames} {student.LastName}".Replace("  ", " ").Trim(),
            student.DateOfBirth, student.Gender, student.PhoneNumber, student.Email, student.Status,
            attendanceRate, score, billed, paid, billed - paid,
            placements.Count, placements.Count(x => string.Equals(x.Status, "Completed", StringComparison.OrdinalIgnoreCase)), certificates,
            await CountAdmissionDocuments(student.AdmissionId, ct)));
    }

    [HttpGet("risk")]
    public async Task<ActionResult<IReadOnlyList<StudentRiskDto>>> Risk(CancellationToken ct)
    {
        var students = await db.Students.AsNoTracking().ToListAsync(ct);
        var attendance = await db.StudentAttendances.AsNoTracking().ToListAsync(ct);
        var assessments = await db.StudentAssessments.AsNoTracking().ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking().ToListAsync(ct);
        var result = new List<StudentRiskDto>();

        foreach (var s in students)
        {
            var sa = attendance.Where(x => x.StudentId == s.Id).ToList();
            var ss = assessments.Where(x => x.StudentId == s.Id).ToList();
            var si = invoices.Where(x => x.StudentId == s.Id).ToList();
            var attendanceRate = sa.Count == 0 ? 100m : sa.Count(x => x.Status.Equals("Present", StringComparison.OrdinalIgnoreCase)) * 100m / sa.Count;
            var score = ss.Count == 0 ? 100m : ss.Average(x => x.MaximumScore == 0 ? 0 : x.Score * 100m / x.MaximumScore);
            var balance = si.Sum(x => x.Amount - x.PaidAmount);
            var risk = 0;
            if (attendanceRate < 75) risk += 40;
            else if (attendanceRate < 85) risk += 20;
            if (score < 50) risk += 40;
            else if (score < 60) risk += 20;
            if (balance > 0) risk += 10;
            var level = risk >= 60 ? "High" : risk >= 30 ? "Moderate" : "Low";
            result.Add(new StudentRiskDto(s.Id, s.StudentNumber, $"{s.FirstName} {s.LastName}", Math.Min(risk, 100), level, Math.Round(attendanceRate, 1), Math.Round(score, 1), balance));
        }
        return Ok(result.OrderByDescending(x => x.RiskScore).Take(100).ToList());
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<GlobalSearchResultDto>>> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2) return Ok(Array.Empty<GlobalSearchResultDto>());
        q = q.Trim();
        var students = await db.Students.AsNoTracking()
            .Where(x => x.StudentNumber.Contains(q) || x.FirstName.Contains(q) || x.LastName.Contains(q) || (x.OtherNames != null && x.OtherNames.Contains(q)))
            .Take(20).ToListAsync(ct);
        var staff = await db.StaffMembers.AsNoTracking().Take(20).ToListAsync(ct);
        var results = students.Select(x => new GlobalSearchResultDto("Student", x.Id, x.StudentNumber, $"{x.FirstName} {x.LastName}", "Student Management"))
            .ToList();
        // Staff fields vary by deployment; return a stable module-level result only when a matching identifier is available.
        results.AddRange(staff.Where(x => x.Id.ToString().Contains(q, StringComparison.OrdinalIgnoreCase))
            .Select(x => new GlobalSearchResultDto("Staff", x.Id, x.Id.ToString(), "Staff member", "Staff")));
        return Ok(results);
    }

    [HttpGet("workflows")]
    public async Task<ActionResult<WorkflowSummaryDto>> Workflows(CancellationToken ct)
    {
        var admissions = await db.Admissions.AsNoTracking().ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking().ToListAsync(ct);
        var placements = await db.StudentPlacements.AsNoTracking().ToListAsync(ct);
        return Ok(new WorkflowSummaryDto(
            admissions.Count(x => x.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase)),
            invoices.Count(x => x.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase) || x.PaidAmount < x.Amount),
            placements.Count(x => x.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase)),
            DateTimeOffset.UtcNow));
    }

    [HttpGet("admissions/{admissionId:guid}/documents")]
    public async Task<ActionResult<IReadOnlyList<AdmissionDocumentDto>>> Documents(Guid admissionId, CancellationToken ct)
    {
        var root = GetDocumentRoot(admissionId);
        if (!Directory.Exists(root)) return Ok(Array.Empty<AdmissionDocumentDto>());
        var files = Directory.EnumerateFiles(root).Select(path => new AdmissionDocumentDto(
            Path.GetFileName(path), new FileInfo(path).Length, System.IO.File.GetLastWriteTimeUtc(path))).ToList();
        await Task.CompletedTask;
        return Ok(files);
    }

    [HttpPost("admissions/{admissionId:guid}/documents")]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<AdmissionDocumentDto>> UploadDocument(Guid admissionId, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("A document is required.");
        if (!await db.Admissions.AnyAsync(x => x.Id == admissionId, ct)) return NotFound("Admission not found.");
        var root = GetDocumentRoot(admissionId);
        Directory.CreateDirectory(root);
        var safeName = Path.GetFileName(file.FileName);
        var path = Path.Combine(root, $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{safeName}");
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream, ct);
        var info = new FileInfo(path);
        return Ok(new AdmissionDocumentDto(info.Name, info.Length, info.LastWriteTimeUtc));
    }

    private string GetDocumentRoot(Guid admissionId) => Path.Combine(environment.ContentRootPath, "App_Data", "Admissions", admissionId.ToString("N"));
    private async Task<int> CountAdmissionDocuments(Guid? admissionId, CancellationToken ct)
    {
        if (admissionId is null) return 0;
        var root = GetDocumentRoot(admissionId.Value);
        await Task.CompletedTask;
        return Directory.Exists(root) ? Directory.EnumerateFiles(root).Count() : 0;
    }
}

public sealed record ModernDashboardDto(int TotalStudents, int ActiveStudents, int PendingAdmissions, decimal TotalBilled, decimal TotalPaid, decimal Outstanding, decimal AttendanceRate, decimal AverageAssessment, decimal PlacementCompletionRate, DateTimeOffset GeneratedAt);
public sealed record Student360Dto(Guid Id, string StudentNumber, string Name, DateOnly? DateOfBirth, string? Gender, string? Phone, string? Email, string Status, decimal AttendanceRate, decimal AverageAssessment, decimal TotalBilled, decimal TotalPaid, decimal Outstanding, int PlacementCount, int CompletedPlacements, int CertificateCount, int AdmissionDocumentCount);
public sealed record StudentRiskDto(Guid StudentId, string StudentNumber, string Name, int RiskScore, string RiskLevel, decimal AttendanceRate, decimal AverageScore, decimal OutstandingBalance);
public sealed record GlobalSearchResultDto(string Type, Guid Id, string Key, string Title, string Module);
public sealed record WorkflowSummaryDto(int PendingAdmissions, int FinancialFollowUps, int PendingPlacements, DateTimeOffset GeneratedAt);
public sealed record AdmissionDocumentDto(string FileName, long SizeBytes, DateTime LastModifiedUtc);
