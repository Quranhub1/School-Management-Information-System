namespace SchoolManagement.Application.Library.External;

public sealed record LibraryIntegrationHealth(
    bool KohaConfigured,
    bool DSpaceConfigured,
    string KohaBaseUrl,
    string DSpaceBaseUrl);
