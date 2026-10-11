namespace SchoolManagement.Domain.Administration;

public sealed class InstitutionGalleryImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public string? Caption { get; set; }
    public required string Source { get; set; }
    public string? ExternalUrl { get; set; }
    public byte[]? ImageData { get; set; }
    public string? ContentType { get; set; }
    public string? OriginalFileName { get; set; }
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}
