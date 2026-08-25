using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Infrastructure.Library;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library/integrations")]
[Authorize(Policy = "LibraryManagement")]
public sealed class LibraryIntegrationsController : ControllerBase
{
    private readonly LibraryIntegrationHealthService _health;

    public LibraryIntegrationsController(LibraryIntegrationHealthService health)
    {
        _health = health;
    }

    [HttpGet("health")]
    public ActionResult<LibraryIntegrationHealth> GetHealth()
        => Ok(_health.GetHealth());

    [HttpPost("check")]
    public async Task<ActionResult<IReadOnlyList<ExternalConnectionResult>>> CheckConnections(
        CancellationToken cancellationToken)
        => Ok(await _health.CheckConnectionsAsync(cancellationToken));
}
