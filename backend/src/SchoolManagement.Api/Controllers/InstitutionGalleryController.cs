using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-gallery")]
public sealed class PublicInstitutionGalleryController(IWebHostEnvironment environment) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly object Sync = new();
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    [AllowAnonymous]
    [HttpGet]
    public IActionResult List()
    {
        var items = ReadItems();
        return Ok(items);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/image")]
    public IActionResult Image(Guid id)
    {
        var item = ReadItems().FirstOrDefault(x => x.Id == id && x.Source == "upload");
        if (item is null || string.IsNullOrWhiteSpace(item.StoredFileName)) return NotFound();

        var root = StorageRoot();
        var file = Path.Combine(root, "images", item.StoredFileName);
        if (!System.IO.File.Exists(file)) return NotFound();

        return PhysicalFile(file, item.ContentType ?? "application/octet-stream");
    }

    private string MetadataFile() => Path.Combine(StorageRoot(), "gallery.json");

    private string StorageRoot() => Path.Combine(environment.ContentRootPath, "App_Data", "Branding", "Gallery");

    private List<GalleryItem> ReadItems()
    {
        lock (Sync)
        {
            var file = MetadataFile();
            if (!System.IO.File.Exists(file)) return [];
            try
            {
                return JsonSerializer.Deserialize<List<GalleryItem>>(System.IO.File.ReadAllText(file), JsonOptions) ?? [];
            }
            catch (JsonException)
            {
                return [];
            }
        }
    }
}

[ApiController]
[Route("api/administration/institution-gallery")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class InstitutionGalleryController(IWebHostEnvironment environment) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web) { WriteIndented = true };
    private static readonly object Sync = new();
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024;

    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? title, [FromForm] string? caption, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "An image file is required." });
        if (file.Length > MaxFileSize) return BadRequest(new { message = "Each gallery image must be 10 MB or smaller." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension)) return BadRequest(new { message = "Only JPG, PNG and WebP images are supported." });

        var id = Guid.NewGuid();
        var storedFileName = id.ToString("N") + extension;
        var imagesRoot = Path.Combine(StorageRoot(), "images");
        Directory.CreateDirectory(imagesRoot);
        var destination = Path.Combine(imagesRoot, storedFileName);

        await using (var stream = System.IO.File.Create(destination))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var item = new GalleryItem(
            id,
            string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title.Trim(),
            string.IsNullOrWhiteSpace(caption) ? null : caption.Trim(),
            $"/api/public/institution-gallery/{id}/image",
            DateTimeOffset.UtcNow,
            "upload",
            storedFileName,
            file.ContentType);

        var items = ReadItems();
        items.Add(item);
        WriteItems(items);
        return Ok(item);
    }

    [HttpPost("url")]
    public IActionResult AddUrl([FromBody] AddGalleryUrlRequest request)
    {
        if (!Uri.TryCreate(request.Url?.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest(new { message = "A valid HTTP or HTTPS image URL is required." });

        var item = new GalleryItem(
            Guid.NewGuid(),
            string.IsNullOrWhiteSpace(request.Title) ? "Institution photograph" : request.Title.Trim(),
            string.IsNullOrWhiteSpace(request.Caption) ? null : request.Caption.Trim(),
            uri.ToString(),
            DateTimeOffset.UtcNow,
            "url",
            null,
            null);

        var items = ReadItems();
        items.Add(item);
        WriteItems(items);
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        var items = ReadItems();
        var item = items.FirstOrDefault(x => x.Id == id);
        if (item is null) return NotFound();

        items.Remove(item);
        WriteItems(items);

        if (item.Source == "upload" && !string.IsNullOrWhiteSpace(item.StoredFileName))
        {
            var file = Path.Combine(StorageRoot(), "images", item.StoredFileName);
            if (System.IO.File.Exists(file)) System.IO.File.Delete(file);
        }

        return NoContent();
    }

    private string MetadataFile() => Path.Combine(StorageRoot(), "gallery.json");

    private string StorageRoot() => Path.Combine(environment.ContentRootPath, "App_Data", "Branding", "Gallery");

    private List<GalleryItem> ReadItems()
    {
        lock (Sync)
        {
            var file = MetadataFile();
            if (!System.IO.File.Exists(file)) return [];
            try
            {
                return JsonSerializer.Deserialize<List<GalleryItem>>(System.IO.File.ReadAllText(file), JsonOptions) ?? [];
            }
            catch (JsonException)
            {
                return [];
            }
        }
    }

    private void WriteItems(List<GalleryItem> items)
    {
        lock (Sync)
        {
            Directory.CreateDirectory(StorageRoot());
            System.IO.File.WriteAllText(MetadataFile(), JsonSerializer.Serialize(items, JsonOptions));
        }
    }
}

public sealed record GalleryItem(
    Guid Id,
    string Title,
    string? Caption,
    string ImageUrl,
    DateTimeOffset UploadedAt,
    string Source,
    string? StoredFileName,
    string? ContentType);

public sealed record AddGalleryUrlRequest(string? Url, string? Title, string? Caption);
