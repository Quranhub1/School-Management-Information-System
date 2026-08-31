using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Access;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Alumni;
using SchoolManagement.Application.Audit;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Application.Calendar;
using SchoolManagement.Application.Certificates;
using SchoolManagement.Application.HR;
using SchoolManagement.Application.Library;
using SchoolManagement.Application.Library.External;
using SchoolManagement.Application.Payroll;
using SchoolManagement.Application.Progression;
using SchoolManagement.Application.Staff;
using SchoolManagement.Application.StudentRecords;
using SchoolManagement.Application.Students;
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
        var connectionString = configuration.GetConnectionString("SchoolManagement")
            ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");

        services.AddDbContext<SchoolManagementDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<ISemesterRepository, SemesterRepository>();
        services.AddScoped<IAcademicRecordRepository, AcademicRecordRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ICurriculumCourseRepository, CurriculumCourseRepository>();
        services.AddScoped<ICourseRegistrationRepository, CourseRegistrationRepository>();
        services.AddScoped<IStudentPromotionRepository, StudentPromotionRepository>();
        services.AddScoped<ISemesterProgressionRepository, SemesterProgressionRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<IAdmissionRepository, AdmissionRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IFinanceRepository, FinanceRepository>();
        services.AddScoped<IFeeRepository, FeeRepository>();
        services.AddScoped<ILibraryRepository, LibraryRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICertificateRepository, CertificateRepository>();
        services.AddScoped<IPayrollRepository, PayrollRepository>();
        services.AddScoped<IAlumniRepository, AlumniRepository>();
        services.AddScoped<ILeaveRequestRepository, LeaveRequestRepository>();
        services.AddScoped<ICalendarEventRepository, CalendarEventRepository>();
        services.AddScoped<IGateLogRepository, GateLogRepository>();
        services.AddScoped<IAuditLogRepository, AuditLogRepository>();
        services.AddScoped<IInstitutionSettingsRepository, InstitutionSettingsRepository>();
        services.AddScoped<IHrRepository, HrRepository>();
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
