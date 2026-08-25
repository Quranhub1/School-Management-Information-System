using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admissions")]
[Authorize(Policy = AdmissionsPolicies.Management)]
public sealed class AdmissionsController(AdmissionsWorkflowService workflow)
    : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateAdmissionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var admission = await workflow.CreateAsync(request, cancellationToken);
            return Created($"/api/admissions/{admission.Id}", admission);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/decision")]
    public async Task<IActionResult> Decide(
        Guid id,
        DecideAdmissionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var decision = await workflow.DecideAsync(id, request, cancellationToken);
            return Ok(decision);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
