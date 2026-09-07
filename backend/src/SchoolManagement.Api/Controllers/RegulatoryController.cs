using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Regulatory;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/regulatory")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class RegulatoryController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("registrations")]
    public async Task<IActionResult> GetRegistrations([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.Set<RegulatoryRegistration>().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(regulatoryBody)) query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken));
    }

    [HttpPost("registrations")]
    public async Task<IActionResult> CreateRegistration(CreateRegulatoryRegistrationRequest request, CancellationToken cancellationToken)
    {
        var registration = new RegulatoryRegistration
        {
            StudentId = request.StudentId, RegistrationNumber = request.RegistrationNumber.Trim(), RegulatoryBody = request.RegulatoryBody.Trim(),
            ProgrammeCode = request.ProgrammeCode.Trim(), ProgrammeName = request.ProgrammeName.Trim(), Level = request.Level.Trim(),
            RegistrationDate = request.RegistrationDate, AssessmentDate = request.AssessmentDate, Status = "Registered",
            VerificationCode = Guid.NewGuid().ToString("N")[..8]
        };
        db.Set<RegulatoryRegistration>().Add(registration);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(registration); }
        catch (DbUpdateException ex) { return Conflict(new { message = "Registration number already exists or database error occurred.", detail = ex.Message }); }
    }

    [HttpGet("assessments")]
    public async Task<IActionResult> GetAssessments([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.Set<Assessment>().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(regulatoryBody)) query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken));
    }

    [HttpPost("assessments")]
    public async Task<IActionResult> CreateAssessment(CreateAssessmentRequest request, CancellationToken cancellationToken)
    {
        var assessment = new Assessment
        {
            AssessmentCode = request.AssessmentCode.Trim(), Title = request.Title.Trim(), RegulatoryBody = request.RegulatoryBody.Trim(),
            ProgrammeCode = request.ProgrammeCode.Trim(), AssessmentType = request.AssessmentType.Trim(), StartDate = request.StartDate,
            EndDate = request.EndDate, DurationMinutes = request.DurationMinutes, PassMark = request.PassMark, TotalMarks = request.TotalMarks, Status = "Scheduled"
        };
        db.Set<Assessment>().Add(assessment);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(assessment); }
        catch (DbUpdateException ex) { return Conflict(new { message = "Assessment code already exists or database error occurred.", detail = ex.Message }); }
    }

    [HttpGet("continuous-assessments")]
    public async Task<IActionResult> GetContinuousAssessments([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        var query = db.Set<ContinuousAssessment>().AsNoTracking();
        if (studentId.HasValue) query = query.Where(x => x.StudentId == studentId.Value);
        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken));
    }

    [HttpPost("continuous-assessments")]
    public async Task<IActionResult> CreateContinuousAssessment(CreateContinuousAssessmentRequest request, CancellationToken cancellationToken)
    {
        var assessment = new ContinuousAssessment
        {
            StudentId = request.StudentId, AssessmentId = request.AssessmentId, AssessmentType = request.AssessmentType.Trim(), Title = request.Title.Trim(),
            Score = request.Score, MaxScore = request.MaxScore, AssessorRemarks = request.AssessorRemarks?.Trim(),
            LogbookReference = request.LogbookReference?.Trim(), ReportReference = request.ReportReference?.Trim(), SubmissionDate = request.SubmissionDate, Status = "Submitted"
        };
        db.Set<ContinuousAssessment>().Add(assessment);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(assessment); }
        catch (DbUpdateException ex) { return BadRequest(new { message = "Unable to save continuous assessment.", detail = ex.Message }); }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.Set<AssessmentResult>().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(regulatoryBody)) query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        return Ok(await query.OrderByDescending(x => x.ReleasedAt).ToListAsync(cancellationToken));
    }

    [HttpPost("results")]
    public async Task<IActionResult> CreateResult(CreateAssessmentResultRequest request, CancellationToken cancellationToken)
    {
        var result = new AssessmentResult
        {
            StudentId = request.StudentId, AssessmentId = request.AssessmentId, RegulatoryBody = request.RegulatoryBody.Trim(),
            Score = request.Score, Grade = request.Grade.Trim(), Passed = request.Passed, Remarks = request.Remarks?.Trim(), ReleasedAt = DateTimeOffset.UtcNow, Status = "Released"
        };
        db.Set<AssessmentResult>().Add(result);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(result); }
        catch (DbUpdateException ex) { return BadRequest(new { message = "Unable to save result.", detail = ex.Message }); }
    }

    [HttpGet("centres")]
    public async Task<IActionResult> GetAssessmentCentres(CancellationToken cancellationToken)
        => Ok(await db.Set<AssessmentCentre>().AsNoTracking().OrderBy(x => x.CentreName).ToListAsync(cancellationToken));

    [HttpPost("centres")]
    public async Task<IActionResult> CreateAssessmentCentre(CreateAssessmentCentreRequest request, CancellationToken cancellationToken)
    {
        var centre = new AssessmentCentre
        {
            CentreCode = request.CentreCode.Trim(), CentreName = request.CentreName.Trim(), RegulatoryBody = request.RegulatoryBody.Trim(),
            Address = request.Address.Trim(), ContactPerson = request.ContactPerson?.Trim(), Phone = request.Phone?.Trim(), Email = request.Email?.Trim(), Status = "Pending"
        };
        db.Set<AssessmentCentre>().Add(centre);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(centre); }
        catch (DbUpdateException ex) { return Conflict(new { message = "Centre code already exists or database error occurred.", detail = ex.Message }); }
    }

    [HttpGet("circulars")]
    public async Task<IActionResult> GetCirculars([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.Set<RegulatoryCircular>().AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(regulatoryBody)) query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        return Ok(await query.OrderByDescending(x => x.IssueDate).ToListAsync(cancellationToken));
    }

    [HttpPost("circulars")]
    public async Task<IActionResult> CreateCircular(CreateRegulatoryCircularRequest request, CancellationToken cancellationToken)
    {
        var circular = new RegulatoryCircular
        {
            CircularNumber = request.CircularNumber.Trim(), Title = request.Title.Trim(), RegulatoryBody = request.RegulatoryBody.Trim(),
            Content = request.Content.Trim(), IssueDate = request.IssueDate, Deadline = request.Deadline, AttachmentUrl = request.AttachmentUrl?.Trim()
        };
        db.Set<RegulatoryCircular>().Add(circular);
        try { await db.SaveChangesAsync(cancellationToken); return Ok(circular); }
        catch (DbUpdateException ex) { return Conflict(new { message = "Circular number already exists or database error occurred.", detail = ex.Message }); }
    }

    public sealed record CreateRegulatoryRegistrationRequest(Guid StudentId, string RegistrationNumber, string RegulatoryBody, string ProgrammeCode, string ProgrammeName, string Level, DateOnly? RegistrationDate, DateOnly? AssessmentDate);
    public sealed record CreateAssessmentRequest(string AssessmentCode, string Title, string RegulatoryBody, string ProgrammeCode, string AssessmentType, DateOnly? StartDate, DateOnly? EndDate, int DurationMinutes, decimal PassMark, decimal TotalMarks);
    public sealed record CreateContinuousAssessmentRequest(Guid StudentId, Guid AssessmentId, string AssessmentType, string Title, decimal Score, decimal MaxScore, string? AssessorRemarks, string? LogbookReference, string? ReportReference, DateOnly? SubmissionDate);
    public sealed record CreateAssessmentResultRequest(Guid StudentId, Guid AssessmentId, string RegulatoryBody, decimal Score, string Grade, bool Passed, string? Remarks);
    public sealed record CreateAssessmentCentreRequest(string CentreCode, string CentreName, string RegulatoryBody, string Address, string? ContactPerson, string? Phone, string? Email);
    public sealed record CreateRegulatoryCircularRequest(string CircularNumber, string Title, string RegulatoryBody, string Content, DateOnly IssueDate, DateOnly? Deadline, string? AttachmentUrl);
}
