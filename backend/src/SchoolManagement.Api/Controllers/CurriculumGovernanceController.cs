using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-management/curricula/{curriculumId:guid}")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumGovernanceController(SchoolManagementDbContext db) : ControllerBase
{
    public sealed record TransitionRequest(string? Notes);
    public sealed record CloneRequest(string Version, string Title, DateOnly EffectiveFrom, DateOnly? EffectiveTo);
    private string Actor => User.Identity?.Name ?? "System";

    [HttpGet("approval-history")]
    public async Task<IActionResult> GetHistory(Guid curriculumId, CancellationToken ct)
    {
        if (!await db.Curricula.AsNoTracking().AnyAsync(x => x.Id == curriculumId, ct))
            return NotFound(new { message = "Curriculum not found." });
        var history = await db.CurriculumApprovalHistory.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId)
            .OrderByDescending(x => x.ChangedAtUtc)
            .ToListAsync(ct);
        return Ok(history);
    }

    [HttpPost("submit-for-review")]
    public Task<IActionResult> Submit(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Draft", "UnderReview", request.Notes, ct);

    [HttpPost("approve")]
    public Task<IActionResult> Approve(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "UnderReview", "Approved", request.Notes, ct);

    [HttpPost("reject")]
    public Task<IActionResult> Reject(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "UnderReview", "Draft", request.Notes, ct, requireNotes: true);

    [HttpPost("retire")]
    public Task<IActionResult> Retire(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Approved", "Retired", request.Notes, ct, deactivate: true, requireNotes: true);

    [HttpPost("clone")]
    public async Task<IActionResult> Clone(Guid curriculumId, [FromBody] CloneRequest request, CancellationToken ct)
    {
        var source = await db.Curricula.FirstOrDefaultAsync(x => x.Id == curriculumId, ct);
        if (source is null) return NotFound(new { message = "Curriculum not found." });
        var version = request.Version?.Trim();
        var title = request.Title?.Trim();
        if (string.IsNullOrWhiteSpace(version) || string.IsNullOrWhiteSpace(title))
            return BadRequest(new { message = "A new version and title are required." });
        if (request.EffectiveTo is not null && request.EffectiveTo < request.EffectiveFrom)
            return BadRequest(new { message = "Effective-to date cannot precede effective-from date." });
        if (await db.Curricula.AnyAsync(x => x.ProgrammeId == source.ProgrammeId && x.Version == version, ct))
            return Conflict(new { message = "That curriculum version already exists for this programme." });

        var programme = await db.Programmes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == source.ProgrammeId, ct);
        if (programme is null || !programme.IsActive || programme.IsReferenceOnly)
            return Conflict(new { message = "Only active, deliverable programmes can receive a curriculum version." });
        var authorityActive = await db.AcademicAuthorities.AsNoTracking()
            .AnyAsync(x => x.Code == programme.Regulator && x.IsActive, ct);
        if (!authorityActive) return Conflict(new { message = "The programme's academic authority is inactive or not registered." });

        var clone = new Curriculum
        {
            ProgrammeId = source.ProgrammeId,
            Version = version,
            Title = title,
            MinimumCredits = source.MinimumCredits,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            ProgrammeType = source.ProgrammeType,
            Status = "Draft",
            IsActive = true
        };
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        db.Curricula.Add(clone);
        var sourceMappings = await db.CurriculumCourses.AsNoTracking()
            .Where(x => x.CurriculumId == source.Id).ToListAsync(ct);
        db.CurriculumCourses.AddRange(sourceMappings.Select(x => new CurriculumCourse
        {
            CurriculumId = clone.Id,
            CourseId = x.CourseId,
            YearOfStudy = x.YearOfStudy,
            SemesterNumber = x.SemesterNumber,
            IsCore = x.IsCore
        }));
        db.CurriculumApprovalHistory.Add(new CurriculumApprovalHistory
        {
            CurriculumId = clone.Id,
            FromStatus = null,
            ToStatus = "Draft",
            Notes = $"Cloned from curriculum {source.Version} ({source.Id}).",
            Actor = Actor
        });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return CreatedAtAction(nameof(GetHistory), new { curriculumId = clone.Id }, clone);
    }

    [HttpGet("compare/{otherCurriculumId:guid}")]
    public async Task<IActionResult> Compare(Guid curriculumId, Guid otherCurriculumId, CancellationToken ct)
    {
        if (curriculumId == otherCurriculumId)
            return BadRequest(new { message = "Choose two different curriculum versions to compare." });
        var curricula = await db.Curricula.AsNoTracking()
            .Where(x => x.Id == curriculumId || x.Id == otherCurriculumId)
            .Join(db.Programmes.AsNoTracking(), c => c.ProgrammeId, p => p.Id,
                (c, p) => new { Curriculum = c, ProgrammeCode = p.Code, ProgrammeName = p.Name })
            .ToListAsync(ct);
        if (curricula.Count != 2) return NotFound(new { message = "One or both curriculum versions were not found." });
        if (curricula[0].Curriculum.ProgrammeId != curricula[1].Curriculum.ProgrammeId)
            return BadRequest(new { message = "Only versions belonging to the same programme can be compared." });

        var ids = new[] { curriculumId, otherCurriculumId };
        var units = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
            where ids.Contains(mapping.CurriculumId)
            select new { mapping.CurriculumId, course.Id, course.Code, course.Name, course.CreditUnits, mapping.YearOfStudy, mapping.SemesterNumber, mapping.IsCore })
            .OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber).ThenBy(x => x.Code)
            .ToListAsync(ct);
        return Ok(new
        {
            programmeCode = curricula[0].ProgrammeCode,
            programmeName = curricula[0].ProgrammeName,
            versions = curricula.Select(x => new { x.Curriculum.Id, x.Curriculum.Version, x.Curriculum.Title, x.Curriculum.EffectiveFrom, x.Curriculum.EffectiveTo, x.Curriculum.Status, x.Curriculum.MinimumCredits }),
            firstOnly = units.Where(x => x.CurriculumId == curriculumId && units.All(y => y.CurriculumId != otherCurriculumId || y.Id != x.Id)),
            secondOnly = units.Where(x => x.CurriculumId == otherCurriculumId && units.All(y => y.CurriculumId != curriculumId || y.Id != x.Id)),
            changedPlacement = units.Where(x => x.CurriculumId == curriculumId && units.Any(y => y.CurriculumId == otherCurriculumId && y.Id == x.Id && (y.YearOfStudy != x.YearOfStudy || y.SemesterNumber != x.SemesterNumber || y.IsCore != x.IsCore)))
        });
    }

    private async Task<IActionResult> Transition(Guid curriculumId, string expectedStatus, string nextStatus,
        string? notes, CancellationToken ct, bool deactivate = false, bool requireNotes = false)
    {
        var curriculum = await db.Curricula.FirstOrDefaultAsync(x => x.Id == curriculumId, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        if (!string.Equals(curriculum.Status, expectedStatus, StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = $"Only a curriculum in '{expectedStatus}' status can move to '{nextStatus}'. Current status: {curriculum.Status}." });
        if (requireNotes && string.IsNullOrWhiteSpace(notes))
            return BadRequest(new { message = "A reason or review note is required for this action." });

        var programme = await db.Programmes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == curriculum.ProgrammeId, ct);
        if (programme is null) return Conflict(new { message = "The curriculum programme no longer exists." });
        var authorityActive = await db.AcademicAuthorities.AsNoTracking()
            .AnyAsync(x => x.Code == programme.Regulator && x.IsActive, ct);
        if (!authorityActive) return Conflict(new { message = "The programme's academic authority is inactive or not registered." });

        if (nextStatus == "UnderReview")
        {
            if (!curriculum.IsActive || !programme.IsActive || programme.IsReferenceOnly)
                return Conflict(new { message = "Only active curricula for active deliverable programmes can be submitted." });
            if (!await db.CurriculumCourses.AnyAsync(x => x.CurriculumId == curriculumId, ct))
                return Conflict(new { message = "Add at least one course unit before submitting this curriculum for review." });
        }

        db.CurriculumApprovalHistory.Add(new CurriculumApprovalHistory
        {
            CurriculumId = curriculum.Id,
            FromStatus = curriculum.Status,
            ToStatus = nextStatus,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            Actor = Actor
        });
        curriculum.Status = nextStatus;
        if (deactivate) curriculum.IsActive = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
