using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Student360;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/student360")]
[Authorize(Policy = AuthorizationPolicies.Student360)]
public sealed class Student360Controller(Student360Service service) : ControllerBase
{
    [HttpGet("{studentId:guid}")]
    public async Task<ActionResult<Student360ProfileDto>> Get(Guid studentId, CancellationToken ct)
    {
        var profile = await service.GetProfileAsync(studentId, ct);
        return Ok(profile);
    }
}
