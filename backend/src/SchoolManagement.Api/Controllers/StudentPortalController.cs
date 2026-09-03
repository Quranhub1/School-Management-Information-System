using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Reporting;
using System.Security.Claims;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/student-portal")]
[Authorize(Policy = AuthorizationPolicies.StudentPortal)]
public sealed class StudentPortalController(SchoolManagementDbContext db, ProgressionAssessment progression, IPdfReportGenerator pdf) : ControllerBase
{
    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.Parse(sub!);
    }

    [HttpGet("me")]
    public async Task<ActionResult<StudentPortalProfile>> GetMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? throw new InvalidOperationException("Username claim not found in token.");

        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.StudentNumber == username, ct);
        if (student is null) return NotFound(new { message = "Student record not found. Contact administration." });

        return Ok(new StudentPortalProfile(
            student.Id,
            student.StudentNumber,
            $"{student.FirstName} {student.LastName}".Trim(),
            student.Status,
            student.FirstName,
            student.LastName,
            student.OtherNames,
            student.DateOfBirth,
            student.Gender,
            student.NationalId,
            student.PhoneNumber,
            student.Email,
            student.CreatedAt,
            student.AdmissionId));
    }

    [HttpGet("me/transcript")]
    public async Task<ActionResult<IReadOnlyList<TranscriptEntry>>> GetTranscript([FromQuery] Guid? academicYearId, [FromQuery] Guid? semesterId, CancellationToken ct)
    {
        var studentId = await ResolveStudentIdAsync(ct);
        var entries = await db.AssessmentTranscriptEntries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .Where(x => !academicYearId.HasValue || x.AcademicYearId == academicYearId.Value)
            .Where(x => !semesterId.HasValue || x.SemesterId == semesterId.Value)
            .OrderByDescending(x => x.AcademicYearId)
            .ThenByDescending(x => x.SemesterId)
            .ThenBy(x => x.CourseCode)
            .ToListAsync(ct);
        return Ok(entries);
    }

    [HttpGet("me/summaries")]
    public async Task<ActionResult<IReadOnlyList<AcademicResultSummary>>> GetSummaries(CancellationToken ct)
    {
        var studentId = await ResolveStudentIdAsync(ct);
        var summaries = await db.AcademicResultSummaries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.AcademicYearId)
            .ThenByDescending(x => x.SemesterId)
            .ToListAsync(ct);
        return Ok(summaries);
    }

    [HttpGet("me/progression")]
    public async Task<ActionResult<ProgressionDecision>> GetProgression(CancellationToken ct)
    {
        var studentId = await ResolveStudentIdAsync(ct);
        var summaries = await db.AcademicResultSummaries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId)
            .ToListAsync(ct);
        if (summaries.Count == 0) return NotFound();

        var latest = summaries.First();
        var transcript = await db.AssessmentTranscriptEntries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(ct);

        var decision = progression.Evaluate(latest, transcript);
        return Ok(decision);
    }

    [HttpGet("me/transcript/pdf")]
    public async Task<IActionResult> DownloadTranscriptPdf(CancellationToken ct)
    {
        var studentId = await ResolveStudentIdAsync(ct);
        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == studentId, ct)
            ?? throw new KeyNotFoundException("Student record not found.");

        var profile = new StudentPortalProfile(
            student.Id, student.StudentNumber, $"{student.FirstName} {student.LastName}".Trim(),
            student.Status, student.FirstName, student.LastName, student.OtherNames,
            student.DateOfBirth, student.Gender, student.NationalId, student.PhoneNumber,
            student.Email, student.CreatedAt, student.AdmissionId);

        var entries = await db.AssessmentTranscriptEntries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId).ThenBy(x => x.CourseCode)
            .ToListAsync(ct);

        var summaries = await db.AcademicResultSummaries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId)
            .ToListAsync(ct);

        var bytes = pdf.GenerateTranscriptPdf(profile, entries, summaries);
        return File(bytes, "application/pdf", $"transcript-{student.StudentNumber}.pdf");
    }

    private async Task<Guid> ResolveStudentIdAsync(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? throw new InvalidOperationException("Username claim not found in token.");

        var student = await db.Students.SingleOrDefaultAsync(x => x.StudentNumber == username, ct);
        if (student is null) throw new KeyNotFoundException("Student record not found.");
        return student.Id;
    }
}

public sealed record StudentPortalProfile(Guid StudentId, string StudentNumber, string FullName, string Status, string FirstName, string LastName, string? OtherNames, DateOnly? DateOfBirth, string? Gender, string? NationalId, string? PhoneNumber, string? Email, DateTimeOffset CreatedAt, Guid? AdmissionId);
