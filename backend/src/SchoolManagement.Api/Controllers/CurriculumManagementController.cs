using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-management")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumManagementController(CurriculumManagementService service, SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("curricula")]
    public async Task<IActionResult> GetCurricula(CancellationToken ct) => Ok(await service.GetCurriculaAsync(ct));

    [HttpPut("curricula/{id:guid}")]
    public async Task<IActionResult> UpdateCurriculum(Guid id, [FromBody] UpdateCurriculumRequest request, CancellationToken ct)
    {
        var (success, error) = await service.UpdateCurriculumAsync(id, request, ct);
        return success ? NoContent() : error == "Curriculum not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPatch("curricula/{id:guid}/active")]
    public async Task<IActionResult> SetCurriculumActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken ct)
    {
        var (success, error) = await service.SetCurriculumActiveAsync(id, request.IsActive, ct);
        return success ? NoContent() : error == "Curriculum not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPost("curricula")]
    public async Task<IActionResult> CreateCurriculum([FromBody] CreateCurriculumRequest request, CancellationToken ct)
    {
        var result = await service.CreateCurriculumAsync(request, ct);
        return result.Success ? Ok(result.Curriculum) : BadRequest(new { message = result.Error });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses(CancellationToken ct) => Ok(await service.GetCoursesAsync(ct));

    [HttpPut("courses/{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest request, CancellationToken ct)
    {
        var (success, error) = await service.UpdateCourseAsync(id, request, ct);
        return success ? NoContent() : error == "Course not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPatch("courses/{id:guid}/active")]
    public async Task<IActionResult> SetCourseActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (course is null) return NotFound(new { message = "Course not found." });
        course.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken ct)
    {
        var result = await service.CreateCourseAsync(request, ct);
        return result.Success ? Ok(result.Course) : BadRequest(new { message = result.Error });
    }

    [HttpGet("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> GetMappings(Guid curriculumId, CancellationToken ct) => Ok(await service.GetMappingsAsync(curriculumId, ct));

    [HttpPut("curricula/{curriculumId:guid}/courses/{mappingId:guid}")]
    public async Task<IActionResult> UpdateMapping(Guid curriculumId, Guid mappingId, [FromBody] UpdateCurriculumCourseRequest request, CancellationToken ct)
    {
        var (success, error) = await service.UpdateMappingAsync(curriculumId, mappingId, request, ct);
        return success ? NoContent() : error == "Curriculum course mapping not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPost("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> AddMapping(Guid curriculumId, [FromBody] AddCurriculumCourseRequest request, CancellationToken ct)
    {
        var curriculum = await db.Curricula.AsNoTracking()
            .Where(x => x.Id == curriculumId)
            .Join(db.Programmes.AsNoTracking(), x => x.ProgrammeId, p => p.Id, (x, p) => new { Curriculum = x, Programme = p })
            .Join(db.AcademicAuthorities.AsNoTracking(), x => x.Programme.Regulator, authority => authority.Code,
                (x, authority) => new { x.Curriculum, x.Programme, Authority = authority.Code, AuthorityIsActive = authority.IsActive })
            .SingleOrDefaultAsync(ct);
        if (curriculum is null)
            return NotFound(new { message = "The selected curriculum, programme or registered academic authority does not exist." });
        if (!curriculum.AuthorityIsActive)
            return Conflict(new { message = "The programme's academic authority is inactive. Activate it before changing curriculum mappings." });
        if (!curriculum.Programme.IsActive || curriculum.Programme.IsReferenceOnly ||
            (curriculum.Programme.ApprovalStatus != "Institutional" &&
             curriculum.Programme.ApprovalStatus != "Verified" &&
             curriculum.Programme.ApprovalStatus != "Approved"))
            return Conflict(new { message = "Only active, institutionally approved or verified programmes can receive curriculum course mappings." });
        if (!curriculum.Curriculum.IsActive)
            return Conflict(new { message = "Activate the curriculum before changing its course mappings." });

        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId && x.IsActive, ct))
            return NotFound(new { message = "The selected active course does not exist." });

        var otherAuthority = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join existingCurriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals existingCurriculum.Id
            join programme in db.Programmes.AsNoTracking() on existingCurriculum.ProgrammeId equals programme.Id
            join authority in db.AcademicAuthorities.AsNoTracking() on programme.Regulator equals authority.Code
            where mapping.CourseId == request.CourseId && mapping.CurriculumId != curriculumId
            select authority.Code)
            .ToListAsync(ct);

        if (otherAuthority.Any(regulator => !string.Equals(
                regulator, curriculum.Authority, StringComparison.OrdinalIgnoreCase)))
        {
            return Conflict(new
            {
                message = $"This course is already assigned to a different curriculum authority. A course cannot be shared between {curriculum.Authority} and another authority."
            });
        }

        var result = await service.AddMappingAsync(curriculumId, request, ct);
        return result.Success ? Ok(result.Mapping) : BadRequest(new { message = result.Error });
    }

    public sealed record SetActiveRequest(bool IsActive);
}
