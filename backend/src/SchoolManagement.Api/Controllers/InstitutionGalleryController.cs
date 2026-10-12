using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-gallery")]
public sealed class PublicInstitutionGalleryController(SchoolManagementDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    private static readonly JsonSerializerOptions LegacyJsonOptions = new(JsonSerializerDefaults.Web);

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        await ImportLegacyGalleryAsync(cancellationToken);
        var items = await db.InstitutionGalleryImages.AsNoTracking()
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new GalleryItem(
                x.Id, x.Title, x.Caption,
                x.Source == "url" ? x.ExternalUrl! : $"/api/public/institution-gallery/{x.Id}/image",
                x.UploadedAt, x.Source))
            .ToListAsync(cancellationToken);
        return Ok(items);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> Image(Guid id, CancellationToken cancellationToken)
    {
        var item = await db.InstitutionGalleryImages.AsNoTracking()
            .Where(x => x.Id == id && x.Source == "upload")
            .Select(x => new { x.ImageData, x.ContentType })
            .FirstOrDefaultAsync(cancellationToken);
        if (item?.ImageData is not { Length: > 0 }) return NotFound();
        return File(item.ImageData, item.ContentType ?? "application/octet-stream");
    }
    private async Task ImportLegacyGalleryAsync(CancellationToken cancellationToken)
    {
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Branding", "Gallery");
        var metadataPath = Path.Combine(root, "gallery.json");
        if (!System.IO.File.Exists(metadataPath)) return;

        try
        {
            var json = await System.IO.File.ReadAllTextAsync(metadataPath, cancellationToken);
            var legacyItems = JsonSerializer.Deserialize<List<LegacyGalleryItem>>(json, LegacyJsonOptions) ?? [];
            if (legacyItems.Count == 0) return;

            var existingIds = await db.InstitutionGalleryImages.AsNoTracking()
                .Select(x => x.Id).ToListAsync(cancellationToken);
            var existing = existingIds.ToHashSet();

            foreach (var legacy in legacyItems)
            {
                if (!existing.Add(legacy.Id)) continue;
                var isUpload = string.Equals(legacy.Source, "upload", StringComparison.OrdinalIgnoreCase);
                byte[]? imageData = null;
                if (isUpload)
                {
                    if (string.IsNullOrWhiteSpace(legacy.StoredFileName)) continue;
                    var filePath = Path.Combine(root, "images", Path.GetFileName(legacy.StoredFileName));
                    if (!System.IO.File.Exists(filePath)) continue;
                    imageData = await System.IO.File.ReadAllBytesAsync(filePath, cancellationToken);
                    if (imageData.Length == 0) continue;
                }
                else if (!Uri.TryCreate(legacy.ImageUrl, UriKind.Absolute, out var externalUri) ||
                         (externalUri.Scheme != Uri.UriSchemeHttp && externalUri.Scheme != Uri.UriSchemeHttps))
                {
                    continue;
                }

                db.InstitutionGalleryImages.Add(new InstitutionGalleryImage
                {
                    Id = legacy.Id,
                    Title = string.IsNullOrWhiteSpace(legacy.Title) ? "Institution photograph" : legacy.Title,
                    Caption = legacy.Caption,
                    Source = isUpload ? "upload" : "url",
                    ExternalUrl = isUpload ? null : legacy.ImageUrl,
                    ImageData = imageData,
                    ContentType = legacy.ContentType,
                    OriginalFileName = legacy.StoredFileName,
                    UploadedAt = legacy.UploadedAt
                });
            }

            if (db.ChangeTracker.HasChanges())
                await db.SaveChangesAsync(cancellationToken);
        }
        catch (JsonException)
        {
            // Leave the legacy file untouched; the regular database gallery remains available.
        }
        catch (IOException)
        {
            // A temporary legacy-file access problem must not take down the public gallery.
        }
    }

    private sealed record LegacyGalleryItem(
        Guid Id,
        string Title,
        string? Caption,
        string ImageUrl,
        DateTimeOffset UploadedAt,
        string Source,
        string? StoredFileName,
        string? ContentType);

}

[ApiController]
[Route("api/administration/institution-gallery")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class InstitutionGalleryController(SchoolManagementDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    [HttpPost("upload")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? title, [FromForm] string? caption, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "An image file is required." });
        if (file.Length > MaxFileSize) return BadRequest(new { message = "Each gallery image must be 10 MB or smaller." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension)) return BadRequest(new { message = "Only JPG, PNG, WebP and GIF images are supported." });
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "The uploaded file must be an image." });

        await using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken);
        var item = new InstitutionGalleryImage
        {
            Id = Guid.NewGuid(),
            Title = string.IsNullOrWhiteSpace(title) ? Path.GetFileNameWithoutExtension(file.FileName) : title.Trim(),
            Caption = string.IsNullOrWhiteSpace(caption) ? null : caption.Trim(),
            Source = "upload",
            ImageData = memory.ToArray(),
            ContentType = file.ContentType,
            OriginalFileName = Path.GetFileName(file.FileName),
            UploadedAt = DateTimeOffset.UtcNow
        };
        db.InstitutionGalleryImages.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        // Verify the upload is visible to a fresh database query before reporting success.
        // This helps distinguish a persisted gallery item from a UI-only success state.
        var persisted = await db.InstitutionGalleryImages.AsNoTracking()
            .AnyAsync(x => x.Id == item.Id, cancellationToken);
        if (!persisted)
            return Problem(
                title: "Gallery image was not persisted",
                detail: "The upload was received, but the saved image could not be read back from the gallery database.",
                statusCode: StatusCodes.Status500InternalServerError);

        return Ok(ToDto(item));
    }

    [HttpPost("url")]
    public async Task<IActionResult> AddUrl([FromBody] AddGalleryUrlRequest request, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(request.Url?.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest(new { message = "A valid HTTP or HTTPS image URL is required." });

        var item = new InstitutionGalleryImage
        {
            Id = Guid.NewGuid(),
            Title = string.IsNullOrWhiteSpace(request.Title) ? "Institution photograph" : request.Title.Trim(),
            Caption = string.IsNullOrWhiteSpace(request.Caption) ? null : request.Caption.Trim(),
            Source = "url",
            ExternalUrl = uri.ToString(),
            UploadedAt = DateTimeOffset.UtcNow
        };
        db.InstitutionGalleryImages.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(item));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var item = await db.InstitutionGalleryImages.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (item is null) return NotFound();
        // Remove the legacy metadata entry too; otherwise a later list request
        // can import a deleted legacy image back into the database.
        await RemoveLegacyGalleryEntryAsync(id, cancellationToken);

        db.InstitutionGalleryImages.Remove(item);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task RemoveLegacyGalleryEntryAsync(Guid id, CancellationToken cancellationToken)
    {
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Branding", "Gallery");
        var metadataPath = Path.Combine(root, "gallery.json");
        if (!System.IO.File.Exists(metadataPath)) return;

        List<LegacyGalleryItem>? legacyItems;
        try
        {
            var json = await System.IO.File.ReadAllTextAsync(metadataPath, cancellationToken);
            legacyItems = JsonSerializer.Deserialize<List<LegacyGalleryItem>>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }
        catch (JsonException)
        {
            return;
        }
        if (legacyItems is null) return;

        var removed = legacyItems.FirstOrDefault(x => x.Id == id);
        if (removed is null) return;

        var remaining = legacyItems.Where(x => x.Id != id).ToList();
        await System.IO.File.WriteAllTextAsync(
            metadataPath,
            JsonSerializer.Serialize(remaining, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            cancellationToken);

        if (string.Equals(removed.Source, "upload", StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(removed.StoredFileName))
        {
            var filePath = Path.Combine(root, "images", Path.GetFileName(removed.StoredFileName));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }
    }

    private sealed record LegacyGalleryItem(
        Guid Id,
        string Title,
        string? Caption,
        string ImageUrl,
        DateTimeOffset UploadedAt,
        string Source,
        string? StoredFileName,
        string? ContentType);

    private static GalleryItem ToDto(InstitutionGalleryImage item) => new(
        item.Id, item.Title, item.Caption,
        item.Source == "url" ? item.ExternalUrl! : $"/api/public/institution-gallery/{item.Id}/image",
        item.UploadedAt, item.Source);
}

public sealed record GalleryItem(Guid Id, string Title, string? Caption, string ImageUrl, DateTimeOffset UploadedAt, string Source);
public sealed record AddGalleryUrlRequest(string? Url, string? Title, string? Caption);
