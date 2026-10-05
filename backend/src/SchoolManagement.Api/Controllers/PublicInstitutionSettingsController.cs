using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-settings")]
public sealed class PublicInstitutionSettingsController(IWebHostEnvironment environment, InstitutionSettingsService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await service.GetActiveAsync(ct);
        Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        return result is null ? NotFound() : Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("logo")]
    public async Task<IActionResult> Logo(CancellationToken ct)
    {
        var logo = await service.GetActiveLogoAsync(ct);
        if (logo is null) return NotFound();
        Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        return File(logo.Value.Data, logo.Value.ContentType);
    }

}
