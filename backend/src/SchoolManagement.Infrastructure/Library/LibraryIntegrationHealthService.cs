using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class LibraryIntegrationHealthService
{
    private readonly ILibraryExternalClient _koha;
    private readonly ILibraryExternalClient _dspace;

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
}
