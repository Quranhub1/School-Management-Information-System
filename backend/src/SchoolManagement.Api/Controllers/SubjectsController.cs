using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using Subject = SchoolManagement.Domain.Academic.Subject;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/subjects")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class SubjectsController(SubjectService service) : ControllerBase
{
    [HttpGet("by-programme/{programmeId:guid}")]
    public async Task<ActionResult<IReadOnlyList<Subject>>> GetByProgramme(Guid programmeId, CancellationToken ct)
        => Ok(await service.GetByProgrammeAsync(programmeId, ct));

    [HttpGet("by-programme/{programmeId:guid}/year/{yearOfStudy:int}")]
    public async Task<ActionResult<IReadOnlyList<Subject>>> GetByProgrammeAndYear(Guid programmeId, int yearOfStudy, CancellationToken ct)
        => Ok(await service.GetByProgrammeAndYearAsync(programmeId, yearOfStudy, ct));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectRequest request, CancellationToken ct)
    {
        var (success, error) = await service.UpdateAsync(id, request, ct);
        return success ? NoContent() : error == "Subject not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPost]
    public async Task<ActionResult<Subject>> Create([FromBody] CreateSubjectRequest request, CancellationToken ct)
    {
        var (success, error, result) = await service.CreateAsync(request, ct);
        if (!success) return BadRequest(new { message = error });
        return Created($"api/subjects/{result!.Id}", result);
    }
}
