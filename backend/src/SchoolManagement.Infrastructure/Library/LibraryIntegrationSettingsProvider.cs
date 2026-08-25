using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public sealed class LibraryIntegrationSettingsProvider : ILibraryIntegrationSettings
{
    public LibraryIntegrationSettingsProvider(LibraryIntegrationSettings settings)
    {
        Current = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public LibraryIntegrationSettings Current { get; }
}
