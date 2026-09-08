using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-settings")]
public sealed class PublicInstitutionSettingsController(InstitutionSettingsService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await service.GetActiveAsync(ct);
        return result is null ? NotFound() : Ok(result);
    }
}
