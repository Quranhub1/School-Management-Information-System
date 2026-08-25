namespace SchoolManagement.Infrastructure.Library;

public sealed record LibraryIntegrationSettings
{
    public string KohaBaseUrl { get; init; } = string.Empty;
    public string DSpaceBaseUrl { get; init; } = string.Empty;
}
