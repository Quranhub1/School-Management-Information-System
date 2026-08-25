namespace SchoolManagement.Application.Library.External;

public sealed record LibraryIntegrationSettings
{
    public string KohaBaseUrl { get; init; } = string.Empty;
    public string DSpaceBaseUrl { get; init; } = string.Empty;
}

public interface ILibraryIntegrationSettings
{
    LibraryIntegrationSettings Current { get; }
}
