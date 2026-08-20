using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Repositories;

namespace SchoolManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SchoolManagement")
            ?? throw new InvalidOperationException(
                "Connection string 'SchoolManagement' is not configured.");

        services.AddDbContext<SchoolManagementDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<DatabaseHealthCheck>();

        return services;
    }
}
