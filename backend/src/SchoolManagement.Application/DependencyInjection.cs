using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<StudentService>();
        services.AddScoped<ProgrammeService>();
        services.AddScoped<AuthService>();
        services.AddScoped<ModuleAccessService>();
        return services;
    }
}
