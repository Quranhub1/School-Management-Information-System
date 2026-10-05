using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration/institution-settings")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed record LogoUrlRequest(string? Url);\n\npublic sealed class InstitutionSettingsController(InstitutionSettingsService service, IWebHostEnvironment environment, IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct) => Ok(await service.GetAllAsync(ct));

    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken ct)
    {
        var result = await service.GetActiveAsync(ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("logo/from-url")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadLogoFromUrl([FromBody] LogoUrlRequest request, CancellationToken ct)
    {
        if (!Uri.TryCreate(request.Url?.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest(new { message = "Logo URL must be a valid HTTP or HTTPS URL." });

        var active = await service.GetActiveAsync(ct);
        if (active is null) return BadRequest(new { message = "Save institution details before downloading the logo." });

        using var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(20);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("SchoolManagementInformationSystem/1.0");
        using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, ct);
        if (!response.IsSuccessStatusCode) return BadRequest(new { message = $"Unable to download logo (HTTP {(int)response.StatusCode})." });

        var contentType = response.Content.Headers.ContentType?.MediaType?.ToLowerInvariant() ?? string.Empty;
        var extension = contentType switch
        {
            "image/png" => ".png",
            "image/jpeg" => ".jpg",
            "image/webp" => ".webp",
            _ => Path.GetExtension(uri.AbsolutePath).ToLowerInvariant()
        };
        if (extension == ".jpeg") extension = ".jpg";
        if (extension is not ".png" and not ".jpg" and not ".webp")
            return BadRequest(new { message = "The URL must point to a PNG, JPEG or WebP image." });

        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        if (bytes.Length == 0 || bytes.Length > 5_000_000)
            return BadRequest(new { message = "Downloaded logo must be between 1 byte and 5 MB." });

        var isImage = extension switch
        {
            ".png" => bytes.Length >= 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47,
            ".jpg" => bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            ".webp" => bytes.Length >= 12 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50,
            _ => false
        };
        if (!isImage) return BadRequest(new { message = "The downloaded file is not a valid PNG, JPEG or WebP image." });

        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Branding");
        Directory.CreateDirectory(root);
        var target = Path.Combine(root, "institution-logo" + extension);
        var temp = Path.Combine(root, "institution-logo.download" + extension);
        await System.IO.File.WriteAllBytesAsync(temp, bytes, ct);

        foreach (var old in Directory.EnumerateFiles(root, "institution-logo.*"))
            if (!string.Equals(old, temp, StringComparison.OrdinalIgnoreCase))
                System.IO.File.Delete(old);
        System.IO.File.Move(temp, target, true);

        var update = new SchoolManagement.Application.Administration.CreateInstitutionSettingsRequest(
            active.InstitutionName, active.Abbreviation, active.Motto, active.Address, active.Phone,
            active.Email, active.Website, active.PostalAddress, active.Country, active.InstitutionType,
            "/api/public/institution-settings/logo", active.PrimaryColor, active.AccentColor);
        return Ok(await service.CreateAsync(update, ct));
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
