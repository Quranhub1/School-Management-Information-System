using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Access;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Audit;
using SchoolManagement.Application.Calendar;
using SchoolManagement.Application.Finance;
using SchoolManagement.Application.HR;
using SchoolManagement.Application.Library;
using SchoolManagement.Application.Library.External;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Infrastructure.Library;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Repositories;
using SchoolManagement.Infrastructure.Reporting;

namespace SchoolManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SchoolManagement") ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");
        services.AddDbContext<SchoolManagementDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<SchoolManagement.Application.Abstractions.IStudentRepository, StudentRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ISemesterRepository, SemesterRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAcademicRecordRepository, AcademicRecordRepository>();
        services.AddScoped<SchoolManagement.Application.Assessment.IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ICourseRepository, CourseRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ICurriculumCourseRepository, CurriculumCourseRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ICourseRegistrationRepository, CourseRegistrationRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IStudentPromotionRepository, StudentPromotionRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ISemesterProgressionRepository, SemesterProgressionRepository>();
        services.AddScoped<SchoolManagement.Application.Attendance.IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAdmissionRepository, AdmissionRepository>();
        services.AddScoped<SchoolManagement.Application.Finance.IFinanceRepository, FinanceRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IFeeRepository, FeeRepository>();
        services.AddScoped<SchoolManagement.Application.Library.ILibraryRepository, LibraryRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IUserRepository, UserRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ICertificateRepository, CertificateRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IPayrollRepository, PayrollRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAlumniRepository, AlumniRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.ILeaveRequestRepository, LeaveRequestRepository>();
        services.AddScoped<SchoolManagement.Application.Calendar.ICalendarEventRepository, CalendarEventRepository>();
        services.AddScoped<SchoolManagement.Application.Access.IGateLogRepository, GateLogRepository>();
        services.AddScoped<SchoolManagement.Application.Audit.IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IInstitutionSettingsRepository, InstitutionSettingsRepository>();
        services.AddScoped<SchoolManagement.Application.HR.IHrRepository, HrRepository>();
        services.AddScoped<SchoolManagement.Application.StudentRecords.IStudentRecordsRepository, StudentRecordsRepository>();
        services.AddScoped<ReportGenerator>();
        services.AddScoped<DatabaseHealthCheck>();
        services.AddSingleton<PasswordHasher>();
        services.AddScoped<AdminSeeder>();
        var kohaSection = configuration.GetSection("LibraryIntegrations:Koha");
        var dspaceSection = configuration.GetSection("LibraryIntegrations:DSpace");
        var librarySettings = new LibraryIntegrationSettings
        {
            KohaBaseUrl = kohaSection["BaseUrl"] ?? string.Empty,
            DSpaceBaseUrl = dspaceSection["BaseUrl"] ?? string.Empty
        };
        services.AddLibraryExternalIntegration(librarySettings);
        return services;
    }
}
