using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/programmes")]
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
}
