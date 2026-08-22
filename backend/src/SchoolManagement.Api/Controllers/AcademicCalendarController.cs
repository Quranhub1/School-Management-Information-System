using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-calendar")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicCalendarController(AcademicCalendarService service) : ControllerBase
{
    [HttpGet("years")]
    public async Task<IActionResult> GetYears(CancellationToken cancellationToken) => Ok(await service.GetYearsAsync(cancellationToken));

    [HttpPost("years")]
    public async Task<IActionResult> CreateYear([FromBody] CreateAcademicYearRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateYearAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Created($"api/academic-calendar/years/{result.Year!.Id}", result.Year);
    }

    [HttpPatch("years/{id:guid}/current")]
    public async Task<IActionResult> SetCurrentYear(Guid id, CancellationToken cancellationToken)
    {
        var result = await service.SetCurrentYearAsync(id, cancellationToken);
        return result.Success ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpGet("years/{academicYearId:guid}/periods")]
    public async Task<IActionResult> GetPeriods(Guid academicYearId, CancellationToken cancellationToken) =>
        Ok(await service.GetSemestersAsync(academicYearId, cancellationToken));

    [HttpPost("periods")]
    public async Task<IActionResult> CreatePeriod([FromBody] CreateSemesterRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateSemesterAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Created($"api/academic-calendar/periods/{result.Semester!.Id}", result.Semester);
    }

    [HttpPatch("years/{academicYearId:guid}/periods/{semesterId:guid}/current")]
    public async Task<IActionResult> SetCurrentPeriod(Guid academicYearId, Guid semesterId, CancellationToken cancellationToken)
    {
        var result = await service.SetCurrentSemesterAsync(academicYearId, semesterId, cancellationToken);
        return result.Success ? NoContent() : BadRequest(new { message = result.Error });
    }
}
