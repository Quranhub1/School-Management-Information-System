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
        return result is null ? NotFound() : Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("logo")]
    public async Task<IActionResult> Logo(CancellationToken ct)
    {
        var active = await service.GetActiveAsync(ct);
        if (active is null) return NotFound();
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Branding");
        var file = Directory.Exists(root) ? Directory.EnumerateFiles(root, "institution-logo.*").FirstOrDefault() : null;
        if (file is null) return NotFound();
        var contentType = Path.GetExtension(file).ToLowerInvariant() switch { ".jpg" or ".jpeg" => "image/jpeg", ".webp" => "image/webp", _ => "image/png" };
        return PhysicalFile(file, contentType);
    }

}
