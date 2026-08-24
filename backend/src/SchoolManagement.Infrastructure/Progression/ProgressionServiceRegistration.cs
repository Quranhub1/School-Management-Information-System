using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Progression;
using SchoolManagement.Infrastructure.Repositories;

namespace SchoolManagement.Infrastructure.Progression;

public static class ProgressionServiceRegistration
{
    public static IServiceCollection AddProgressionInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<ISemesterProgressionRepository, SemesterProgressionRepository>();
        return services;
    }
}
