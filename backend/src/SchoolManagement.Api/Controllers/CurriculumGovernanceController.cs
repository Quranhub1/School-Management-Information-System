using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-governance/curricula/{curriculumId:guid}")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumGovernanceController(CurriculumManagementService service, SchoolManagementDbContext db) : ControllerBase
{
    public sealed record TransitionRequest(string? Notes);
    public sealed record CloneRequest(string Version, string Title, DateOnly EffectiveFrom, DateOnly? EffectiveTo);
    private string Actor => User.Identity?.Name ?? "System";

    [HttpGet("approval-history")]
    public async Task<IActionResult> GetHistory(Guid curriculumId, CancellationToken ct)
    {
        if (!await db.Curricula.AsNoTracking().AnyAsync(x => x.Id == curriculumId && !x.IsDeleted, ct))
            return NotFound(new { message = "Curriculum not found." });
        var history = await db.CurriculumApprovalHistory.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId)
            .OrderByDescending(x => x.ChangedAtUtc)
            .ToListAsync(ct);
        return Ok(history);
    }

    [HttpPost("submit-for-review")]
    public Task<IActionResult> Submit(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Draft", "Submitted", request.Notes, ct);

    [HttpPost("approve")]
    public Task<IActionResult> Approve(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Submitted", "Approved", request.Notes, ct);

    [HttpPost("reject")]
    public Task<IActionResult> Reject(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Submitted", "Draft", request.Notes, ct, requireNotes: true);

    [HttpPost("publish")]
    public Task<IActionResult> Publish(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Approved", "Published", request.Notes, ct, activate: true);

    [HttpPost("retire")]
    public Task<IActionResult> Retire(Guid curriculumId, [FromBody] TransitionRequest request, CancellationToken ct) =>
        Transition(curriculumId, "Approved|Published", "Retired", request.Notes, ct, deactivate: true, requireNotes: true);

    [HttpPost("clone")]
    public async Task<IActionResult> Clone(Guid curriculumId, [FromBody] CloneRequest request, CancellationToken ct)
    {
        var source = await db.Curricula.FirstOrDefaultAsync(x => x.Id == curriculumId && !x.IsDeleted, ct);
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
            .Where(x => x.CurriculumId == source.Id && !x.IsDeleted).ToListAsync(ct);
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
            .Where(x => (x.Id == curriculumId || x.Id == otherCurriculumId) && !x.IsDeleted)
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
            where ids.Contains(mapping.CurriculumId) && !mapping.IsDeleted && !course.IsDeleted
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
        string? notes, CancellationToken ct, bool deactivate = false, bool requireNotes = false, bool activate = false)
    {
        var curriculum = await db.Curricula.FirstOrDefaultAsync(x => x.Id == curriculumId, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        var allowedStatuses = expectedStatus.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (!allowedStatuses.Contains(curriculum.Status, StringComparer.OrdinalIgnoreCase))
            return Conflict(new { message = $"Curriculum status '{curriculum.Status}' is not valid for this action." });
        if (requireNotes && string.IsNullOrWhiteSpace(notes))
            return BadRequest(new { message = "A reason or review note is required for this action." });

        var programme = await db.Programmes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == curriculum.ProgrammeId, ct);
        if (programme is null) return Conflict(new { message = "The curriculum programme no longer exists." });
        var authorityActive = await db.AcademicAuthorities.AsNoTracking()
            .AnyAsync(x => x.Code == programme.Regulator && x.IsActive, ct);
        if (!authorityActive) return Conflict(new { message = "The programme's academic authority is inactive or not registered." });

        if (nextStatus == "Submitted")
        {
            if (!curriculum.IsActive || !programme.IsActive || programme.IsReferenceOnly)
                return Conflict(new { message = "Only active curricula for active deliverable programmes can be submitted." });
            var mappings = await db.CurriculumCourses.AsNoTracking()
                .Where(x => x.CurriculumId == curriculumId && !x.IsDeleted).ToListAsync(ct);
            if (mappings.Count == 0)
                return Conflict(new { message = "Add at least one course unit before submitting this curriculum for review." });
            var courseIds = mappings.Select(x => x.CourseId).Distinct().ToArray();
            var activeCourseCount = await db.Courses.AsNoTracking()
                .CountAsync(x => courseIds.Contains(x.Id) && x.IsActive && !x.IsDeleted, ct);
            if (activeCourseCount != courseIds.Length)
                return Conflict(new { message = "Remove or replace inactive course units before submitting this curriculum." });
            foreach (var courseId in courseIds)
            {
                if (!await service.ValidatePrerequisitesAsync(curriculumId, courseId, ct))
                    return Conflict(new { message = "A mandatory course prerequisite is missing from this curriculum. Add the prerequisite course unit before submitting." });
            }
            foreach (var semester in mappings.Select(x => new { x.YearOfStudy, x.SemesterNumber }).Distinct())
            {
                if (!await service.ValidateCreditLoadAsync(curriculumId, semester.YearOfStudy, semester.SemesterNumber, ct))
                    return Conflict(new { message = $"Year {semester.YearOfStudy}, semester {semester.SemesterNumber} exceeds the maximum credit load of 24 units." });
            }
            var totalCredits = await db.CurriculumCourses.AsNoTracking()
                .Where(x => x.CurriculumId == curriculumId && !x.IsDeleted)
                .Join(db.Courses.AsNoTracking().Where(x => !x.IsDeleted), mapping => mapping.CourseId, course => course.Id,
                    (mapping, course) => (int?)course.CreditUnits)
                .SumAsync(ct) ?? 0;
            if (curriculum.MinimumCredits > 0 && totalCredits < curriculum.MinimumCredits)
                return Conflict(new { message = $"The curriculum currently contains {totalCredits} credits; at least {curriculum.MinimumCredits} are required." });
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
        if (activate) curriculum.IsActive = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
