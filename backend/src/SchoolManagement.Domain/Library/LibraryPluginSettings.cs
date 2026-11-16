namespace SchoolManagement.Domain.Library;

public sealed class LibraryPluginSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string KohaOpacUrl { get; set; } = string.Empty;
    public string KohaApiUrl { get; set; } = string.Empty;
    public string? KohaUsername { get; set; }
    public string? KohaPasswordProtected { get; set; }
    public string DSpaceBaseUrl { get; set; } = string.Empty;
    public string DSpaceRestApiUrl { get; set; } = string.Empty;
    public string DSpaceOaiPmhUrl { get; set; } = string.Empty;
    public string? DSpaceUsername { get; set; }
    public string? DSpacePasswordProtected { get; set; }
    public bool KohaEnabled { get; set; }
    public bool DSpaceEnabled { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
