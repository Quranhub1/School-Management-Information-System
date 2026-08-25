using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Library.External;

namespace SchoolManagement.Infrastructure.Library;

public static class LibraryIntegrationRegistration
{
    public static IServiceCollection AddLibraryExternalIntegration(
        this IServiceCollection services,
        LibraryIntegrationSettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        services.AddSingleton<ILibraryIntegrationSettings>(new LibraryIntegrationSettingsProvider(settings));
        services.AddHttpClient<KohaExternalClient>(client => client.Timeout = TimeSpan.FromSeconds(10));
        services.AddHttpClient<DSpaceExternalClient>(client => client.Timeout = TimeSpan.FromSeconds(10));
        services.AddSingleton<ILibraryExternalClient>(sp => sp.GetRequiredService<KohaExternalClient>());
        services.AddSingleton<LibraryIntegrationHealthService>();

        return services;
    }
}
