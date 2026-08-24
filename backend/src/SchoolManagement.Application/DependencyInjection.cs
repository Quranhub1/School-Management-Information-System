using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Attendance;
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
        services.AddScoped<AcademicRecordService>();
        services.AddScoped<AcademicCalendarService>();
        services.AddScoped<CurriculumManagementService>();
        services.AddScoped<CourseRegistrationService>();
        services.AddScoped<AssessmentService>();
        services.AddScoped<TranscriptStatusService>();
        services.AddScoped<ProgressionAssessment>();
        services.AddScoped<StudentPromotionService>();
        services.AddScoped<AttendanceService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AdministrationService>();
        services.AddScoped<ModuleAccessService>();
        return services;
    }
}
