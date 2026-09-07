using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using AcademicClass = SchoolManagement.Domain.Academic.AcademicClass;
using ClassStatus = SchoolManagement.Domain.Academic.ClassStatus;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-classes")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicClassesController(AcademicClassService service) : ControllerBase
{
    [HttpGet("by-programme/{programmeId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AcademicClass>>> GetByProgramme(Guid programmeId, CancellationToken ct)
        => Ok(await service.GetByProgrammeAsync(programmeId, ct));

    [HttpGet("by-period/{periodId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AcademicClass>>> GetByPeriod(Guid periodId, CancellationToken ct)
        => Ok(await service.GetByPeriodAsync(periodId, ct));

    [HttpPost]
    public async Task<ActionResult<AcademicClass>> Create([FromBody] CreateAcademicClassRequest request, CancellationToken ct)
    {
        var (success, error, result) = await service.CreateAsync(request, ct);
        if (!success) return BadRequest(new { message = error });
        return Created($"api/academic-classes/{result!.Id}", result);
    }

    [HttpPatch("{id:guid}/status")]
    public<IActionResult> SetStatus(Guid id, [FromBody] SetClassStatusRequest request) => NoContent();
}

public sealed record SetClassStatusRequest(ClassStatus Status);
