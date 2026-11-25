using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/programmes")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class ProgrammesController(ProgrammeService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok((await service.GetAllAsync(cancellationToken)).Select(ProgrammeResponseDto.FromDomain).ToArray());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var programme = await service.GetByIdAsync(id, cancellationToken);
        return programme is null ? NotFound() : Ok(ProgrammeResponseDto.FromDomain(programme));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgrammeRequest request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Programme!.Id }, ProgrammeResponseDto.FromDomain(result.Programme));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateProgrammeRequest request, CancellationToken cancellationToken)
    {
        var result = await service.UpdateAsync(id, request, cancellationToken);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Ok(ProgrammeResponseDto.FromDomain(result.Programme!));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await service.DeleteAsync(id, cancellationToken);
        if (!result.Found) return NotFound(new { message = "Programme was not found." });
        if (!result.Deleted) return Conflict(new { message = result.Error });
        return NoContent();
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetProgrammeActiveRequest request, CancellationToken cancellationToken)
    {
        var updated = await service.SetActiveAsync(id, request.Active, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}

public sealed record SetProgrammeActiveRequest(bool Active);

public sealed record ProgrammeResponseDto(
    Guid Id,
    Guid? DepartmentId,
    string Code,
    string Name,
    string Award,
    string? AwardTitle,
    int DurationYears,
    string DurationUnit,
    string StudyMode,
    string DeliveryType,
    ProgrammeType Type,
    string? Regulator,
    string? ApprovalReference,
    DateOnly? ApprovalDate,
    string ApprovalStatus,
    string? SourceReference,
    bool IsReferenceOnly,
    bool IsActive)
{
    public static ProgrammeResponseDto FromDomain(Programme programme) => new(
        programme.Id,
        programme.DepartmentId,
        ToDisplayCode(programme.Code),
        programme.Name,
        programme.Award,
        programme.AwardTitle,
        programme.DurationYears,
        programme.DurationUnit,
        programme.StudyMode,
        programme.DeliveryType,
        programme.Type,
        programme.Regulator,
        programme.ApprovalReference,
        programme.ApprovalDate,
        programme.ApprovalStatus,
        programme.SourceReference,
        programme.IsReferenceOnly,
        programme.IsActive);

    private static string ToDisplayCode(string code)
    {
        foreach (var prefix in new[] { "KSHS-", "UHPAB-", "UVTAB-", "SB-" })
        {
            if (code.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return code[prefix.Length..];
        }

        return code;
    }
}
