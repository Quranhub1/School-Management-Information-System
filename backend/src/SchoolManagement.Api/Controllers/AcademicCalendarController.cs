using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using AcademicYearRequest = SchoolManagement.Application.Academic.CreateAcademicYearRequest;
using SemesterRequest = SchoolManagement.Application.Academic.CreateSemesterRequest;
using UpdateYearRequest = SchoolManagement.Application.Academic.UpdateAcademicYearRequest;
using UpdatePeriodRequest = SchoolManagement.Application.Academic.UpdateSemesterRequest;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-calendar")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicCalendarController(AcademicCalendarService service) : ControllerBase
{
    [HttpGet("years")]
    public async Task<IActionResult> GetYears(CancellationToken cancellationToken) => Ok(await service.GetYearsAsync(cancellationToken));

    [HttpPost("years")]
    public async Task<IActionResult> CreateYear([FromBody] AcademicYearRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateYearAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Created($"api/academic-calendar/years/{result.Year!.Id}", result.Year);
    }

    [HttpPut("years/{id:guid}")]
    public async Task<IActionResult> UpdateYear(Guid id, [FromBody] UpdateYearRequest request, CancellationToken cancellationToken)
    {
        var result = await service.UpdateYearAsync(id, request, cancellationToken);
        return result.Success ? NoContent() : result.Error == "Academic year was not found." ? NotFound(new { message = result.Error }) : BadRequest(new { message = result.Error });
    }

    [HttpPatch("years/{id:guid}/active")]
    public async Task<IActionResult> SetYearActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SetYearActiveAsync(id, request.IsActive, cancellationToken);
        return result.Success ? NoContent() : result.Error == "Academic year was not found." ? NotFound(new { message = result.Error }) : BadRequest(new { message = result.Error });
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
    public async Task<IActionResult> CreatePeriod([FromBody] SemesterRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateSemesterAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Created($"api/academic-calendar/periods/{result.Semester!.Id}", result.Semester);
    }

    [HttpPut("years/{academicYearId:guid}/periods/{semesterId:guid}")]
    public async Task<IActionResult> UpdatePeriod(Guid academicYearId, Guid semesterId, [FromBody] UpdatePeriodRequest request, CancellationToken cancellationToken)
    {
        var result = await service.UpdateSemesterAsync(academicYearId, semesterId, request, cancellationToken);
        return result.Success ? NoContent() : result.Error == "Academic year was not found." || result.Error == "Academic period was not found." ? NotFound(new { message = result.Error }) : BadRequest(new { message = result.Error });
    }

    [HttpPatch("years/{academicYearId:guid}/periods/{semesterId:guid}/active")]
    public async Task<IActionResult> SetPeriodActive(Guid academicYearId, Guid semesterId, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SetPeriodActiveAsync(academicYearId, semesterId, request.IsActive, cancellationToken);
        return result.Success ? NoContent() : result.Error == "Academic period was not found." ? NotFound(new { message = result.Error }) : BadRequest(new { message = result.Error });
    }

    [HttpPatch("years/{academicYearId:guid}/periods/{semesterId:guid}/current")]
    public async Task<IActionResult> SetCurrentPeriod(Guid academicYearId, Guid semesterId, CancellationToken cancellationToken)
    {
        var result = await service.SetCurrentSemesterAsync(academicYearId, semesterId, cancellationToken);
        return result.Success ? NoContent() : BadRequest(new { message = result.Error });
    }
    public sealed record SetActiveRequest(bool IsActive);
}
