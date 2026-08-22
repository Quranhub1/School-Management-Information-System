using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/programmes")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class ProgrammesController(ProgrammeService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(await service.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var programme = await service.GetByIdAsync(id, cancellationToken);
        return programme is null ? NotFound() : Ok(programme);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgrammeRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Programme!.Id }, result.Programme);
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetProgrammeActiveRequest request, CancellationToken cancellationToken)
    {
        var updated = await service.SetActiveAsync(id, request.Active, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}

public sealed record SetProgrammeActiveRequest(bool Active);
