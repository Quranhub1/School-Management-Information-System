using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Infrastructure.Identity;
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
            ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");

        services.AddDbContext<SchoolManagementDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<ISemesterRepository, SemesterRepository>();
        services.AddScoped<IAcademicRecordRepository, AcademicRecordRepository>();
        services.AddScoped<IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<DatabaseHealthCheck>();
        services.AddSingleton<PasswordHasher>();
        services.AddScoped<AdminSeeder>();
        return services;
    }
}
