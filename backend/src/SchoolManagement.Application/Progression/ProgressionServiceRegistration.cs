using Microsoft.Extensions.DependencyInjection;

namespace SchoolManagement.Application.Progression;

public static class ProgressionServiceRegistration
{
    public static IServiceCollection AddProgressionServices(this IServiceCollection services)
    {
        services.AddScoped<ISemesterProgressionService, SemesterProgressionService>();
        return services;
    }
}