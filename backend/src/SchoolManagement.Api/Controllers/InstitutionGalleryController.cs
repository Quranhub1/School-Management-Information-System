using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/public/institution-gallery")]
public sealed class PublicInstitutionGalleryController(SchoolManagementDbContext db) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
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
}

[ApiController]
[Route("api/administration/institution-gallery")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class InstitutionGalleryController(SchoolManagementDbContext db) : ControllerBase
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
        db.InstitutionGalleryImages.Remove(item);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static GalleryItem ToDto(InstitutionGalleryImage item) => new(
        item.Id, item.Title, item.Caption,
        item.Source == "url" ? item.ExternalUrl! : $"/api/public/institution-gallery/{item.Id}/image",
        item.UploadedAt, item.Source);
}

public sealed record GalleryItem(Guid Id, string Title, string? Caption, string ImageUrl, DateTimeOffset UploadedAt, string Source);
public sealed record AddGalleryUrlRequest(string? Url, string? Title, string? Caption);
