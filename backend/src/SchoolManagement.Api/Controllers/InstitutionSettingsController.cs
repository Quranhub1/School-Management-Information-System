using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration/institution-settings")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class InstitutionSettingsController(InstitutionSettingsService service, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) => Ok(await service.GetAllAsync(ct));

    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await service.GetActiveAsync(ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("logo")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadLogo(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "A logo image is required." });
        if (file.Length > 5_000_000) return BadRequest(new { message = "Logo exceeds the 5 MB limit." });
        var allowed = new[] { "image/png", "image/jpeg", "image/webp" };
        if (!allowed.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase)) return BadRequest(new { message = "Logo must be PNG, JPEG or WebP." });
        var active = await service.GetActiveAsync(ct);
        if (active is null) return BadRequest(new { message = "Save institution details before uploading the logo." });
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Branding");
        Directory.CreateDirectory(root);
        foreach (var old in Directory.EnumerateFiles(root, "institution-logo.*")) System.IO.File.Delete(old);
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".png" && extension != ".jpg" && extension != ".jpeg" && extension != ".webp") extension = ".png";
        await using (var stream = System.IO.File.Create(Path.Combine(root, "institution-logo" + extension))) await file.CopyToAsync(stream, ct);
        var request = new SchoolManagement.Application.Administration.CreateInstitutionSettingsRequest(active.InstitutionName, active.Abbreviation, active.Motto, active.Address, active.Phone, active.Email, active.Website, active.PostalAddress, active.Country, active.InstitutionType, "/api/public/institution-settings/logo", active.PrimaryColor, active.AccentColor);
        return Ok(await service.CreateAsync(request, ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstitutionSettingsRequest request, CancellationToken ct)
    {
        try
        {
            var result = await service.CreateAsync(request, ct);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
