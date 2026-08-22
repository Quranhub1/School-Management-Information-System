using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-management")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumManagementController(CurriculumManagementService service) : ControllerBase
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
        var result = await service.AddMappingAsync(curriculumId, request, ct);
        return result.Success ? Ok(result.Mapping) : BadRequest(new { message = result.Error });
    }
}
