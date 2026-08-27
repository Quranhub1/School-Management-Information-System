using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admissions")]
[Authorize(Policy = AdmissionsPolicies.Management)]
public sealed class AdmissionsController(AdmissionsWorkflowService workflow, SchoolManagementDbContext db)
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

    [HttpGet("requirements")]
    public async Task<IActionResult> GetRequirements([FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        var query = db.AdmissionRequirements.AsNoTracking().AsQueryable();
        if (programmeId.HasValue)
            query = query.Where(x => x.ProgrammeId == programmeId.Value);
        var data = await query.OrderBy(x => x.DisplayOrder).ToListAsync(cancellationToken);
        return Ok(data);
    }

    [HttpPost("requirements")]
    public async Task<IActionResult> CreateRequirement(CreateAdmissionRequirementRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var requirement = new AdmissionRequirement
            {
                ProgrammeId = request.ProgrammeId,
                RequirementType = request.RequirementType.Trim(),
                Description = request.Description.Trim(),
                IsMandatory = request.IsMandatory,
                DisplayOrder = request.DisplayOrder,
                IsActive = true
            };
            await db.AdmissionRequirements.AddAsync(requirement, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            return Ok(requirement);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Unable to create requirement.", detail = ex.Message });
        }
    }

    [HttpDelete("requirements/{id:guid}")]
    public async Task<IActionResult> DeleteRequirement(Guid id, CancellationToken cancellationToken)
    {
        var requirement = await db.AdmissionRequirements.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (requirement is null) return NotFound();
        db.AdmissionRequirements.Remove(requirement);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public record CreateAdmissionRequirementRequest(
    Guid ProgrammeId,
    string RequirementType,
    string Description,
    bool IsMandatory,
    int DisplayOrder);
