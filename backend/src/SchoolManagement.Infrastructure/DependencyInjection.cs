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
        services.AddScoped<Abstractions.IStudentRepository, StudentRepository>();
        services.AddScoped<Abstractions.IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<Abstractions.IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<Abstractions.ISemesterRepository, SemesterRepository>();
        services.AddScoped<Abstractions.IAcademicRecordRepository, AcademicRecordRepository>();
        services.AddScoped<Assessment.IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<Abstractions.ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<Abstractions.ICourseRepository, CourseRepository>();
        services.AddScoped<Abstractions.ICurriculumCourseRepository, CurriculumCourseRepository>();
        services.AddScoped<Abstractions.ICourseRegistrationRepository, CourseRegistrationRepository>();
        services.AddScoped<Abstractions.IStudentPromotionRepository, StudentPromotionRepository>();
        services.AddScoped<Abstractions.ISemesterProgressionRepository, SemesterProgressionRepository>();
        services.AddScoped<Attendance.IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<Abstractions.IAdmissionRepository, AdmissionRepository>();
        services.AddScoped<Finance.IFinanceRepository, FinanceRepository>();
        services.AddScoped<Abstractions.IFeeRepository, FeeRepository>();
        services.AddScoped<Library.ILibraryRepository, LibraryRepository>();
        services.AddScoped<Abstractions.IUserRepository, UserRepository>();
        services.AddScoped<Abstractions.ICertificateRepository, CertificateRepository>();
        services.AddScoped<Abstractions.IPayrollRepository, PayrollRepository>();
        services.AddScoped<Abstractions.IAlumniRepository, AlumniRepository>();
        services.AddScoped<Abstractions.ILeaveRequestRepository, LeaveRequestRepository>();
        services.AddScoped<Calendar.ICalendarEventRepository, CalendarEventRepository>();
        services.AddScoped<Access.IGateLogRepository, GateLogRepository>();
        services.AddScoped<Audit.IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<Abstractions.IInstitutionSettingsRepository, InstitutionSettingsRepository>();
        services.AddScoped<HR.IHrRepository, HrRepository>();
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
