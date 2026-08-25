using System.Net.Http;
using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class DSpaceExternalClient : ILibraryExternalClient
{
    private readonly HttpClient _httpClient;

    public DSpaceExternalClient(ILibraryIntegrationSettings settings, HttpClient httpClient)
    {
        ArgumentNullException.ThrowIfNull(settings);
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        var value = settings.Current.DSpaceBaseUrl?.Trim();
        BaseUri = Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
                  (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            ? uri
            : null;
    }

    public string SystemName => "DSpace";
    public Uri? BaseUri { get; }
    public bool IsConfigured => BaseUri is not null;

    public async Task<ExternalConnectionResult> CheckConnectionAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            return new(SystemName, false, false, "DSpace endpoint is not configured.");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Head, BaseUri);
            using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            return new(SystemName, true, true, $"DSpace responded with HTTP {(int)response.StatusCode}.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new(SystemName, true, false, "DSpace connection timed out.");
        }
        catch (HttpRequestException ex)
        {
            return new(SystemName, true, false, $"DSpace connection failed: {ex.Message}");
        }
    }
}
