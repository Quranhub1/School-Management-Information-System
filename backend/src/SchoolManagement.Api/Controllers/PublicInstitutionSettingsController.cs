using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-settings")]
public sealed class PublicInstitutionSettingsController(InstitutionSettingsService service, IWebHostEnvironment environment) : ControllerBase
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
        var active = await service.GetActiveAsync(ct);
        if (active is null || string.IsNullOrWhiteSpace(active.LogoPath)) return NotFound();
        if (active.LogoData is null || active.LogoData.Length == 0) return NotFound();
        var contentType = string.IsNullOrWhiteSpace(active.LogoContentType) ? "image/png" : active.LogoContentType;
        Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
        Response.Headers.Pragma = "no-cache";
        return File(active.LogoData, contentType);
    }

}
