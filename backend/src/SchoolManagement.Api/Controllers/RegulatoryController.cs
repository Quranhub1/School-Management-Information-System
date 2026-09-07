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
        var query = db.RegulatoryRegistrations.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(regulatoryBody))
            query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        var data = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("registrations")]
    public async Task<IActionResult> CreateRegistration(CreateRegulatoryRegistrationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var registration = new RegulatoryRegistration
            {
                StudentId = request.StudentId,
                RegistrationNumber = request.RegistrationNumber.Trim(),
                RegulatoryBody = request.RegulatoryBody.Trim(),
                ProgrammeCode = request.ProgrammeCode.Trim(),
                ProgrammeName = request.ProgrammeName.Trim(),
                Level = request.Level.Trim(),
                RegistrationDate = request.RegistrationDate,
                AssessmentDate = request.AssessmentDate,
                Status = "Registered",
                VerificationCode = Guid.NewGuid().ToString("N")[..8]
            };
            await db.RegulatoryRegistrations.AddAsync(registration, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(registration);
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new { message = "Registration number already exists or database error occurred.", detail = ex.Message });
        }
    }

    [HttpGet("assessments")]
    public async Task<IActionResult> GetAssessments([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.RegulatoryAssessments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(regulatoryBody))
            query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        var data = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("assessments")]
    public async Task<IActionResult> CreateAssessment(CreateAssessmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var assessment = new Assessment
            {
                AssessmentCode = request.AssessmentCode.Trim(),
                Title = request.Title.Trim(),
                RegulatoryBody = request.RegulatoryBody.Trim(),
                ProgrammeCode = request.ProgrammeCode.Trim(),
                AssessmentType = request.AssessmentType.Trim(),
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                DurationMinutes = request.DurationMinutes,
                PassMark = request.PassMark,
                TotalMarks = request.TotalMarks,
                Status = "Scheduled"
            };
            await db.RegulatoryAssessments.AddAsync(assessment, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(assessment);
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new { message = "Assessment code already exists or database error occurred.", detail = ex.Message });
        }
    }

    [HttpGet("continuous-assessments")]
    public async Task<IActionResult> GetContinuousAssessments([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        var query = db.ContinuousAssessments.AsNoTracking().AsQueryable();
        if (studentId.HasValue)
            query = query.Where(x => x.StudentId == studentId.Value);
        var data = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("continuous-assessments")]
    public async Task<IActionResult> CreateContinuousAssessment(CreateContinuousAssessmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var assessment = new ContinuousAssessment
            {
                StudentId = request.StudentId,
                AssessmentId = request.AssessmentId,
                AssessmentType = request.AssessmentType.Trim(),
                Title = request.Title.Trim(),
                Score = request.Score,
                MaxScore = request.MaxScore,
                AssessorRemarks = request.AssessorRemarks?.Trim(),
                LogbookReference = request.LogbookReference?.Trim(),
                ReportReference = request.ReportReference?.Trim(),
                SubmissionDate = request.SubmissionDate,
                Status = "Submitted"
            };
            await db.ContinuousAssessments.AddAsync(assessment, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(assessment);
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new { message = "Unable to save continuous assessment.", detail = ex.Message });
        }
    }

    [HttpGet("results")]
    public async Task<IActionResult> GetResults([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.AssessmentResults.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(regulatoryBody))
            query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        var data = await query.OrderByDescending(x => x.ReleasedAt).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("results")]
    public async Task<IActionResult> CreateResult(CreateAssessmentResultRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = new AssessmentResult
            {
                StudentId = request.StudentId,
                AssessmentId = request.AssessmentId,
                RegulatoryBody = request.RegulatoryBody.Trim(),
                Score = request.Score,
                Grade = request.Grade.Trim(),
                Passed = request.Passed,
                Remarks = request.Remarks?.Trim(),
                ReleasedAt = DateTimeOffset.UtcNow,
                Status = "Released"
            };
            await db.AssessmentResults.AddAsync(result, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(result);
        }
        catch (DbUpdateException ex)
        {
            return BadRequest(new { message = "Unable to save result.", detail = ex.Message });
        }
    }

    [HttpGet("centres")]
    public async Task<IActionResult> GetAssessmentCentres(CancellationToken cancellationToken)
    {
        var data = await db.AssessmentCentres.AsNoTracking().OrderBy(x => x.CentreName).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("centres")]
    public async Task<IActionResult> CreateAssessmentCentre(CreateAssessmentCentreRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var centre = new AssessmentCentre
            {
                CentreCode = request.CentreCode.Trim(),
                CentreName = request.CentreName.Trim(),
                RegulatoryBody = request.RegulatoryBody.Trim(),
                Address = request.Address.Trim(),
                ContactPerson = request.ContactPerson?.Trim(),
                Phone = request.Phone?.Trim(),
                Email = request.Email?.Trim(),
                Status = "Pending"
            };
            await db.AssessmentCentres.AddAsync(centre, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(centre);
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new { message = "Centre code already exists or database error occurred.", detail = ex.Message });
        }
    }

    [HttpGet("circulars")]
    public async Task<IActionResult> GetCirculars([FromQuery] string? regulatoryBody, CancellationToken cancellationToken)
    {
        var query = db.RegulatoryCirculars.AsNoTracking().Where(x => x.IsActive).AsQueryable();
        if (!string.IsNullOrWhiteSpace(regulatoryBody))
            query = query.Where(x => x.RegulatoryBody == regulatoryBody.Trim());
        var data = await query.OrderByDescending(x => x.IssueDate).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("circulars")]
    public async Task<IActionResult> CreateCircular(CreateRegulatoryCircularRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var circular = new RegulatoryCircular
            {
                CircularNumber = request.CircularNumber.Trim(),
                Title = request.Title.Trim(),
                RegulatoryBody = request.RegulatoryBody.Trim(),
                Content = request.Content.Trim(),
                IssueDate = request.IssueDate,
                Deadline = request.Deadline,
                AttachmentUrl = request.AttachmentUrl?.Trim()
            };
            await db.RegulatoryCirculars.AddAsync(circular, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(circular);
        }
        catch (DbUpdateException ex)
        {
            return Conflict(new { message = "Circular number already exists or database error occurred.", detail = ex.Message });
        }
    }

    public sealed record CreateRegulatoryRegistrationRequest(
        Guid StudentId,
        string RegistrationNumber,
        string RegulatoryBody,
        string ProgrammeCode,
        string ProgrammeName,
        string Level,
        DateOnly? RegistrationDate,
        DateOnly? AssessmentDate);

    public sealed record CreateAssessmentRequest(
        string AssessmentCode,
        string Title,
        string RegulatoryBody,
        string ProgrammeCode,
        string AssessmentType,
        DateOnly? StartDate,
        DateOnly? EndDate,
        int DurationMinutes,
        decimal PassMark,
        decimal TotalMarks);

    public sealed record CreateContinuousAssessmentRequest(
        Guid StudentId,
        Guid AssessmentId,
        string AssessmentType,
        string Title,
        decimal Score,
        decimal MaxScore,
        string? AssessorRemarks,
        string? LogbookReference,
        string? ReportReference,
        DateOnly? SubmissionDate);

    public sealed record CreateAssessmentResultRequest(
        Guid StudentId,
        Guid AssessmentId,
        string RegulatoryBody,
        decimal Score,
        string Grade,
        bool Passed,
        string? Remarks);

    public sealed record CreateAssessmentCentreRequest(
        string CentreCode,
        string CentreName,
        string RegulatoryBody,
        string Address,
        string? ContactPerson,
        string? Phone,
        string? Email);

    public sealed record CreateRegulatoryCircularRequest(
        string CircularNumber,
        string Title,
        string RegulatoryBody,
        string Content,
        DateOnly IssueDate,
        DateOnly? Deadline,
        string? AttachmentUrl);
}