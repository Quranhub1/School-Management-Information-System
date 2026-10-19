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

    [HttpPost("curricula")]
    public async Task<IActionResult> CreateCurriculum([FromBody] CreateCurriculumRequest request, CancellationToken ct)
    {
        var result = await service.CreateCurriculumAsync(request, ct);
        return result.Success ? Ok(result.Curriculum) : BadRequest(new { message = result.Error });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses(CancellationToken ct) => Ok(await service.GetCoursesAsync(ct));

    [HttpPost("courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken ct)
    {
        var result = await service.CreateCourseAsync(request, ct);
        return result.Success ? Ok(result.Course) : BadRequest(new { message = result.Error });
    }

    [HttpGet("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> GetMappings(Guid curriculumId, CancellationToken ct) => Ok(await service.GetMappingsAsync(curriculumId, ct));

    [HttpPost("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> AddMapping(Guid curriculumId, [FromBody] AddCurriculumCourseRequest request, CancellationToken ct)
    {
        var curriculum = await db.Curricula.AsNoTracking()
            .Where(x => x.Id == curriculumId)
            .Join(db.Programmes.AsNoTracking(), x => x.ProgrammeId, p => p.Id,
                (x, p) => new { Curriculum = x, Authority = ResolveAuthority(p.Regulator) })
            .SingleOrDefaultAsync(ct);
        if (curriculum is null)
            return NotFound(new { message = "The selected curriculum or its programme does not exist." });

        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId, ct))
            return NotFound(new { message = "The selected course does not exist." });

        var otherAuthority = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join existingCurriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals existingCurriculum.Id
            join programme in db.Programmes.AsNoTracking() on existingCurriculum.ProgrammeId equals programme.Id
            where mapping.CourseId == request.CourseId && mapping.CurriculumId != curriculumId
            select programme.Regulator)
            .ToListAsync(ct);

        if (otherAuthority.Any(regulator => !string.Equals(
                ResolveAuthority(regulator), curriculum.Authority, StringComparison.OrdinalIgnoreCase)))
        {
            return Conflict(new
            {
                message = $"This course is already assigned to a different curriculum authority. A course cannot be shared between {curriculum.Authority} and another authority."
            });
        }

        var result = await service.AddMappingAsync(curriculumId, request, ct);
        return result.Success ? Ok(result.Mapping) : BadRequest(new { message = result.Error });
    }

    private static string ResolveAuthority(string? regulator)
    {
        var value = (regulator ?? string.Empty).Trim();
        if (value.Contains("UHPAB", StringComparison.OrdinalIgnoreCase)) return "UHPAB";
        if (value.Contains("UVTAB", StringComparison.OrdinalIgnoreCase)) return "UVTAB";
        return "School-based";
    }
}
