using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<StudentService>();
        services.AddScoped<ProgrammeService>();
        return services;
    }
}
