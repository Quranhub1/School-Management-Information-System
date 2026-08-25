using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class LibraryIntegrationHealthService
{
    private readonly KohaExternalClient _koha;
    private readonly DSpaceExternalClient _dspace;

    public LibraryIntegrationHealthService(KohaExternalClient koha, DSpaceExternalClient dspace)
    {
        _koha = koha;
        _dspace = dspace;
    }

    public LibraryIntegrationHealth GetHealth() => new(
        _koha.IsConfigured,
        _dspace.IsConfigured,
        _koha.BaseUri?.ToString() ?? string.Empty,
        _dspace.BaseUri?.ToString() ?? string.Empty);

    public async Task<IReadOnlyList<ExternalConnectionResult>> CheckConnectionsAsync(
        CancellationToken cancellationToken = default)
    {
        var results = await Task.WhenAll(
            _koha.CheckConnectionAsync(cancellationToken),
            _dspace.CheckConnectionAsync(cancellationToken));

        return results;
    }
}
