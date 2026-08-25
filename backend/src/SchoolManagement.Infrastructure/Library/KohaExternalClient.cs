using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class KohaExternalClient : ILibraryExternalClient
{
    public KohaExternalClient(ILibraryIntegrationSettings settings)
    {
        var value = settings.Current.KohaBaseUrl?.Trim();
        BaseUri = Uri.TryCreate(value, UriKind.Absolute, out var uri) ? uri : null;
    }

    public string SystemName => "KOHA";
    public Uri? BaseUri { get; }
    public bool IsConfigured => BaseUri is not null;
}
