using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-authorities")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicAuthoritiesController(AcademicAuthorityService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default) =>
        Ok(await service.GetAllAsync(includeInactive, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveAcademicAuthorityRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return CreatedAtAction(nameof(GetAll), new { code = result.Authority!.Code }, result.Authority);
    }

    [HttpPut("{code}")]
    public async Task<IActionResult> Update(string code, [FromBody] SaveAcademicAuthorityRequest request, CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(code, request, cancellationToken);
        return result.Success ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpPatch("{code}/active")]
    public async Task<IActionResult> SetActive(string code, [FromBody] SetAcademicAuthorityActiveRequest request, CancellationToken cancellationToken)
    {
        var updated = await service.SetActiveAsync(code, request.Active, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}

public sealed record SetAcademicAuthorityActiveRequest(bool Active);
