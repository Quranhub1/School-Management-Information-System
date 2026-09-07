using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using Stream = SchoolManagement.Domain.Academic.Stream;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/streams")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class StreamsController(StreamService service) : ControllerBase
{
    [HttpGet("by-class/{classId:guid}")]
    public async Task<ActionResult<IReadOnlyList<Stream>>> GetByClass(Guid classId, CancellationToken ct)
        => Ok(await service.GetByClassAsync(classId, ct));

    [HttpPost]
    public async Task<ActionResult<Stream>> Create([FromBody] SchoolManagement.Application.Academic.CreateStreamRequest request, CancellationToken ct)
    {
        var result = await service.CreateAsync(request, ct);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Created($"/api/streams/{result.Stream!.Id}", result.Stream);
    }
}
