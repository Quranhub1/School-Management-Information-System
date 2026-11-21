using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-management")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumLogbooksController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("curricula/{curriculumId:guid}/logbook-requirements")]
    public async Task<IActionResult> GetRequirements(Guid curriculumId, CancellationToken ct)
    {
        if (!await db.Curricula.AnyAsync(x => x.Id == curriculumId, ct)) return NotFound();
        var requirements = await db.LogbookRequirements.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId)
            .OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber).ThenBy(x => x.Title)
            .ToListAsync(ct);
        var ids = requirements.Select(x => x.Id).ToArray();
        var competencies = await db.LogbookCompetencyRequirements.AsNoTracking()
            .Where(x => ids.Contains(x.LogbookRequirementId)).OrderBy(x => x.Name).ToListAsync(ct);
        return Ok(requirements.Select(x => new LogbookRequirementResponse(
            x.Id, x.CurriculumId, x.Title, x.Description, x.YearOfStudy, x.SemesterNumber,
            x.RequiredQuantity, x.IsMandatory, x.IsActive,
            competencies.Where(c => c.LogbookRequirementId == x.Id).Select(ToResponse).ToArray())).ToArray());
    }

    [HttpPost("curricula/{curriculumId:guid}/logbook-requirements")]
    public async Task<IActionResult> CreateRequirement(Guid curriculumId, [FromBody] CreateLogbookRequirementRequest request, CancellationToken ct)
    {
        if (!await db.Curricula.AnyAsync(x => x.Id == curriculumId, ct)) return NotFound(new { message = "Curriculum not found." });
        if (string.IsNullOrWhiteSpace(request.Title) || request.YearOfStudy < 1 || request.SemesterNumber < 1 || request.RequiredQuantity < 1)
            return BadRequest(new { message = "Title, positive study year, semester and required quantity are required." });
        var entity = new LogbookRequirement
        {
            CurriculumId = curriculumId, Title = request.Title.Trim(), Description = request.Description?.Trim(),
            YearOfStudy = request.YearOfStudy, SemesterNumber = request.SemesterNumber,
            RequiredQuantity = request.RequiredQuantity, IsMandatory = request.IsMandatory, IsActive = true
        };
        db.LogbookRequirements.Add(entity);
        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(entity, []));
    }

    [HttpPost("logbook-requirements/{requirementId:guid}/competencies")]
    public async Task<IActionResult> CreateCompetency(Guid requirementId, [FromBody] CreateLogbookCompetencyRequest request, CancellationToken ct)
    {
        if (!await db.LogbookRequirements.AnyAsync(x => x.Id == requirementId, ct)) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name) || request.RequiredCount < 1)
            return BadRequest(new { message = "Competency code, name and a positive required count are required." });
        if (await db.LogbookCompetencyRequirements.AnyAsync(x => x.LogbookRequirementId == requirementId && x.Code == request.Code.Trim(), ct))
            return Conflict(new { message = "A competency with that code already exists for this logbook requirement." });
        var entity = new LogbookCompetencyRequirement
        {
            LogbookRequirementId = requirementId, Code = request.Code.Trim(), Name = request.Name.Trim(),
            RequiredCount = request.RequiredCount, IsMandatory = request.IsMandatory
        };
        db.LogbookCompetencyRequirements.Add(entity);
        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(entity));
    }

    [HttpGet("students/{studentId:guid}/logbooks")]
    public async Task<IActionResult> GetStudentLogbooks(Guid studentId, [FromQuery] Guid? curriculumId, CancellationToken ct)
    {
        if (!await db.Students.AnyAsync(x => x.Id == studentId, ct)) return NotFound(new { message = "Student not found." });
        var query = from logbook in db.StudentLogbooks.AsNoTracking()
                    join requirement in db.LogbookRequirements.AsNoTracking() on logbook.LogbookRequirementId equals requirement.Id
                    where logbook.StudentId == studentId && (!curriculumId.HasValue || requirement.CurriculumId == curriculumId.Value)
                    orderby logbook.IssuedOn descending
                    select new { Logbook = logbook, Requirement = requirement };
        var rows = await query.ToListAsync(ct);
        var logbookIds = rows.Select(x => x.Logbook.Id).ToArray();
        var assessments = await db.StudentLogbookCompetencies.AsNoTracking().Where(x => logbookIds.Contains(x.StudentLogbookId)).ToListAsync(ct);
        return Ok(rows.Select(x => new StudentLogbookDetailResponse(
            ToResponse(x.Logbook),
            new LogbookRequirementSummaryResponse(x.Requirement.Id, x.Requirement.CurriculumId, x.Requirement.Title, x.Requirement.Description, x.Requirement.YearOfStudy, x.Requirement.SemesterNumber, x.Requirement.RequiredQuantity, x.Requirement.IsMandatory, x.Requirement.IsActive),
            assessments.Where(a => a.StudentLogbookId == x.Logbook.Id).Select(ToResponse).ToArray())).ToArray());
    }

    [HttpPost("students/{studentId:guid}/logbooks")]
    public async Task<IActionResult> IssueLogbook(Guid studentId, [FromBody] IssueStudentLogbookRequest request, CancellationToken ct)
    {
        if (!await db.Students.AnyAsync(x => x.Id == studentId, ct)) return NotFound(new { message = "Student not found." });
        var requirement = await db.LogbookRequirements.FirstOrDefaultAsync(x => x.Id == request.LogbookRequirementId && x.IsActive, ct);
        if (requirement is null) return BadRequest(new { message = "Select an active curriculum logbook requirement." });
        if (string.IsNullOrWhiteSpace(request.SerialNumber) || request.IssuedOn == default)
            return BadRequest(new { message = "A unique logbook serial number and valid issue date are required." });
        if (await db.StudentLogbooks.AnyAsync(x => x.SerialNumber == request.SerialNumber.Trim(), ct))
            return Conflict(new { message = "That logbook serial number has already been issued." });
        var issuedCount = await db.StudentLogbooks.CountAsync(x => x.StudentId == studentId && x.LogbookRequirementId == requirement.Id && x.Status != "Void", ct);
        if (issuedCount >= requirement.RequiredQuantity)
            return Conflict(new { message = "The required number of logbooks has already been issued for this student." });
        var entity = new StudentLogbook
        {
            StudentId = studentId, LogbookRequirementId = requirement.Id,
            SerialNumber = request.SerialNumber.Trim(), IssuedOn = request.IssuedOn,
            IssuedBy = request.IssuedBy?.Trim(), Remarks = request.Remarks?.Trim(), Status = "Issued"
        };
        db.StudentLogbooks.Add(entity);
        await db.SaveChangesAsync(ct);
        var competencyRequirements = await db.LogbookCompetencyRequirements.AsNoTracking()
            .Where(x => x.LogbookRequirementId == requirement.Id && x.IsActive).ToListAsync(ct);
        foreach (var competency in competencyRequirements)
        {
            for (var attempt = 0; attempt < competency.RequiredCount; attempt++)
                db.StudentLogbookCompetencies.Add(new StudentLogbookCompetency { StudentLogbookId = entity.Id, CompetencyRequirementId = competency.Id });
        }
        await db.SaveChangesAsync(ct);
        var issuedAssessments = await db.StudentLogbookCompetencies.AsNoTracking()
            .Where(x => x.StudentLogbookId == entity.Id).ToListAsync(ct);
        return Ok(
            new StudentLogbookDetailResponse(
                ToResponse(entity),
                new LogbookRequirementSummaryResponse(requirement.Id, requirement.CurriculumId, requirement.Title, requirement.Description, requirement.YearOfStudy, requirement.SemesterNumber, requirement.RequiredQuantity, requirement.IsMandatory, requirement.IsActive),
                issuedAssessments.Select(ToResponse).ToArray()));
    }

    [HttpPut("student-logbooks/{logbookId:guid}/competencies/{assessmentId:guid}")]
    public async Task<IActionResult> AssessCompetency(Guid logbookId, Guid assessmentId, [FromBody] AssessLogbookCompetencyRequest request, CancellationToken ct)
    {
        var assessment = await db.StudentLogbookCompetencies.FirstOrDefaultAsync(x => x.Id == assessmentId && x.StudentLogbookId == logbookId, ct);
        if (assessment is null) return NotFound();
        var outcome = request.Outcome?.Trim();
        if (outcome is not ("Competent" or "NotYetCompetent" or "Pending"))
            return BadRequest(new { message = "Outcome must be Competent, NotYetCompetent or Pending." });
        if (outcome != "Pending" && (string.IsNullOrWhiteSpace(request.AssessorName) || request.AssessedOn is null))
            return BadRequest(new { message = "Assessor name and assessment date are required for a signed assessment." });
        if (request.StudentPlacementId.HasValue)
        {
            var logbookStudentId = await db.StudentLogbooks.Where(x => x.Id == logbookId).Select(x => x.StudentId).SingleAsync(ct);
            if (!await db.StudentPlacements.AnyAsync(x => x.Id == request.StudentPlacementId.Value && x.StudentId == logbookStudentId, ct))
                return BadRequest(new { message = "The selected placement does not belong to this student." });
        }
        assessment.Outcome = outcome;
        assessment.AssessedOn = request.AssessedOn;
        assessment.AssessorName = request.AssessorName?.Trim();
        assessment.AssessorRole = request.AssessorRole?.Trim();
        assessment.StudentPlacementId = request.StudentPlacementId;
        assessment.EvidenceReference = request.EvidenceReference?.Trim();
        assessment.Remarks = request.Remarks?.Trim();
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("student-logbooks/{logbookId:guid}/status")]
    public async Task<IActionResult> UpdateLogbookStatus(Guid logbookId, [FromBody] UpdateStudentLogbookStatusRequest request, CancellationToken ct)
    {
        var entity = await db.StudentLogbooks.FirstOrDefaultAsync(x => x.Id == logbookId, ct);
        if (entity is null) return NotFound();
        if (request.Status is not ("Issued" or "Submitted" or "Verified" or "Lost" or "Void"))
            return BadRequest(new { message = "Status must be Issued, Submitted, Verified, Lost or Void." });
        if (request.Status == "Verified")
        {
            var incomplete = await db.StudentLogbookCompetencies.AnyAsync(x => x.StudentLogbookId == logbookId && x.Outcome != "Competent", ct);
            if (incomplete) return Conflict(new { message = "This logbook cannot be verified until every recorded competency assessment is marked Competent." });
        }
        entity.Status = request.Status;
        if (request.Status == "Submitted") entity.SubmittedOn = request.SubmittedOn ?? DateOnly.FromDateTime(DateTime.UtcNow);
        entity.Remarks = request.Remarks?.Trim() ?? entity.Remarks;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("students/{studentId:guid}/logbook-eligibility/{curriculumId:guid}")]
    public async Task<IActionResult> GetLogbookEligibility(Guid studentId, Guid curriculumId, CancellationToken ct)
    {
        if (!await db.Students.AnyAsync(x => x.Id == studentId, ct)) return NotFound(new { message = "Student not found." });
        var requirements = await db.LogbookRequirements.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && x.IsActive && x.IsMandatory).ToListAsync(ct);
        var requirementIds = requirements.Select(x => x.Id).ToArray();
        var issued = await db.StudentLogbooks.AsNoTracking()
            .Where(x => x.StudentId == studentId && requirementIds.Contains(x.LogbookRequirementId) && x.Status != "Void" && x.Status != "Lost")
            .ToListAsync(ct);
        var competencyRequirements = await db.LogbookCompetencyRequirements.AsNoTracking()
            .Where(x => requirementIds.Contains(x.LogbookRequirementId) && x.IsActive && x.IsMandatory).ToListAsync(ct);
        var assessments = await db.StudentLogbookCompetencies.AsNoTracking()
            .Where(x => issued.Select(i => i.Id).Contains(x.StudentLogbookId)).ToListAsync(ct);
        var gaps = requirements.Select(requirement =>
        {
            var books = issued.Where(x => x.LogbookRequirementId == requirement.Id).ToList();
            var competencyGaps = competencyRequirements.Where(x => x.LogbookRequirementId == requirement.Id)
                .Select(competency =>
                {
                    var achieved = assessments.Count(a => books.Any(b => b.Id == a.StudentLogbookId) && a.CompetencyRequirementId == competency.Id && a.Outcome == "Competent");
                    return new { competency.Code, competency.Name, Required = competency.RequiredCount, Achieved = achieved, Complete = achieved >= competency.RequiredCount };
                }).ToList();
            return new
            {
                requirement.Id, requirement.Title, RequiredLogbooks = requirement.RequiredQuantity,
                IssuedLogbooks = books.Count, LogbooksComplete = books.Count >= requirement.RequiredQuantity,
                Competencies = competencyGaps, CompetenciesComplete = competencyGaps.All(x => x.Complete)
            };
        }).ToList();
        return Ok(new { StudentId = studentId, CurriculumId = curriculumId, HasRequirements = requirements.Count > 0, IsComplete = requirements.Count > 0 && gaps.All(x => x.LogbooksComplete && x.CompetenciesComplete), Requirements = gaps,
            Notice = "This is an academic tracking result only. It does not automatically block assessment registration; apply the institution's approved eligibility policy." });
    }

    [HttpGet("uhpab-fee-references")]
    public async Task<IActionResult> GetUhpabFeeReferences([FromQuery] string? programmeCode, [FromQuery] string? category, CancellationToken ct)
    {
        var query = db.UhpabFeeReferences.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(programmeCode)) query = query.Where(x => x.ProgrammeCode == programmeCode.Trim());
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(x => x.Category == category.Trim());
        var references = await query.OrderBy(x => x.Category).ThenBy(x => x.ProgrammeCode).ThenBy(x => x.Description).ToListAsync(ct);
        return Ok(references.Select(ToResponse).ToArray());
    }

    [HttpPost("uhpab-fee-references")]
    public async Task<IActionResult> CreateUhpabFeeReference([FromBody] CreateUhpabFeeReferenceRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Category) || string.IsNullOrWhiteSpace(request.Description) ||
            request.Amount < 0 || string.IsNullOrWhiteSpace(request.Currency) || request.Currency.Trim().Length != 3 ||
            string.IsNullOrWhiteSpace(request.SourceTitle) ||
            !Uri.TryCreate(request.SourceUrl, UriKind.Absolute, out var source) ||
            source.Scheme != Uri.UriSchemeHttps || !source.Host.Equals("uhpab.go.ug", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Provide a category, description, non-negative amount, three-letter currency and an HTTPS UHPAB source URL." });
        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value < request.EffectiveFrom)
            return BadRequest(new { message = "Effective end date cannot be earlier than the start date." });
        var entity = new UhpabFeeReference
        {
            Category = request.Category.Trim(), ProgrammeCode = request.ProgrammeCode?.Trim(),
            ProgrammeName = request.ProgrammeName?.Trim(), Description = request.Description.Trim(),
            Amount = request.Amount, Currency = request.Currency.Trim().ToUpperInvariant(),
            SourceUrl = request.SourceUrl, SourceTitle = request.SourceTitle.Trim(),
            SourceCheckedOn = request.SourceCheckedOn, EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo, IsActive = true
        };
        db.UhpabFeeReferences.Add(entity);
        await db.SaveChangesAsync(ct);
        return Ok(ToResponse(entity));
    }

    private static LogbookCompetencyRequirementResponse ToResponse(LogbookCompetencyRequirement entity) =>
        new(entity.Id, entity.LogbookRequirementId, entity.Code, entity.Name, entity.RequiredCount, entity.IsMandatory, entity.IsActive);

    private static LogbookRequirementResponse ToResponse(LogbookRequirement entity, IReadOnlyCollection<LogbookCompetencyRequirementResponse> competencies) =>
        new(entity.Id, entity.CurriculumId, entity.Title, entity.Description, entity.YearOfStudy, entity.SemesterNumber,
            entity.RequiredQuantity, entity.IsMandatory, entity.IsActive, competencies);

    private static StudentLogbookResponse ToResponse(StudentLogbook entity) =>
        new(entity.Id, entity.StudentId, entity.LogbookRequirementId, entity.SerialNumber, entity.IssuedOn,
            entity.SubmittedOn, entity.Status, entity.IssuedBy, entity.Remarks);

    private static StudentLogbookCompetencyResponse ToResponse(StudentLogbookCompetency entity) =>
        new(entity.Id, entity.StudentLogbookId, entity.CompetencyRequirementId, entity.StudentPlacementId,
            entity.Outcome, entity.AssessedOn, entity.AssessorName, entity.AssessorRole,
            entity.EvidenceReference, entity.Remarks);

    private static UhpabFeeReferenceResponse ToResponse(UhpabFeeReference entity) =>
        new(entity.Id, entity.Category, entity.ProgrammeCode, entity.ProgrammeName, entity.Description,
            entity.Amount, entity.Currency, entity.SourceUrl, entity.SourceTitle, entity.SourceCheckedOn,
            entity.EffectiveFrom, entity.EffectiveTo, entity.IsActive);

}


public sealed record LogbookRequirementResponse(Guid Id, Guid CurriculumId, string Title, string? Description, int YearOfStudy, int SemesterNumber, int RequiredQuantity, bool IsMandatory, bool IsActive, IReadOnlyCollection<LogbookCompetencyRequirementResponse> Competencies);
public sealed record LogbookCompetencyRequirementResponse(Guid Id, Guid LogbookRequirementId, string Code, string Name, int RequiredCount, bool IsMandatory, bool IsActive);
public sealed record LogbookRequirementSummaryResponse(Guid Id, Guid CurriculumId, string Title, string? Description, int YearOfStudy, int SemesterNumber, int RequiredQuantity, bool IsMandatory, bool IsActive);
public sealed record StudentLogbookResponse(Guid Id, Guid StudentId, Guid LogbookRequirementId, string SerialNumber, DateOnly IssuedOn, DateOnly? SubmittedOn, string Status, string? IssuedBy, string? Remarks);
public sealed record StudentLogbookCompetencyResponse(Guid Id, Guid StudentLogbookId, Guid CompetencyRequirementId, Guid? StudentPlacementId, string Outcome, DateOnly? AssessedOn, string? AssessorName, string? AssessorRole, string? EvidenceReference, string? Remarks);
public sealed record StudentLogbookDetailResponse(StudentLogbookResponse Logbook, LogbookRequirementSummaryResponse Requirement, IReadOnlyCollection<StudentLogbookCompetencyResponse> Competencies);
public sealed record UhpabFeeReferenceResponse(Guid Id, string Category, string? ProgrammeCode, string? ProgrammeName, string Description, decimal Amount, string Currency, string SourceUrl, string SourceTitle, DateOnly SourceCheckedOn, DateOnly EffectiveFrom, DateOnly? EffectiveTo, bool IsActive);

public sealed record CreateLogbookRequirementRequest(string Title, string? Description, int YearOfStudy, int SemesterNumber, int RequiredQuantity, bool IsMandatory);
public sealed record CreateLogbookCompetencyRequest(string Code, string Name, int RequiredCount, bool IsMandatory);
public sealed record IssueStudentLogbookRequest(Guid LogbookRequirementId, string SerialNumber, DateOnly IssuedOn, string? IssuedBy, string? Remarks);
public sealed record AssessLogbookCompetencyRequest(string Outcome, DateOnly? AssessedOn, string? AssessorName, string? AssessorRole, Guid? StudentPlacementId, string? EvidenceReference, string? Remarks);
public sealed record UpdateStudentLogbookStatusRequest(string Status, DateOnly? SubmittedOn, string? Remarks);
public sealed record CreateUhpabFeeReferenceRequest(string Category, string? ProgrammeCode, string? ProgrammeName, string Description, decimal Amount, string Currency, string SourceUrl, string SourceTitle, DateOnly SourceCheckedOn, DateOnly EffectiveFrom, DateOnly? EffectiveTo);
