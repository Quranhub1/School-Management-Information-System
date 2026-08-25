using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class DSpaceExternalClient : ILibraryExternalClient
{
    public DSpaceExternalClient(ILibraryIntegrationSettings settings)
    {
        var value = settings.Current.DSpaceBaseUrl?.Trim();
        BaseUri = Uri.TryCreate(value, UriKind.Absolute, out var uri) ? uri : null;
    }

    public string SystemName => "DSpace";
    public Uri? BaseUri { get; }
    public bool IsConfigured => BaseUri is not null;
}
