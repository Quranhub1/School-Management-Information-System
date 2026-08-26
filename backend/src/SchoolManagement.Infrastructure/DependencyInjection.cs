using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Application.Certificates;
using SchoolManagement.Application.Finance;
using SchoolManagement.Application.ImportExport;
using SchoolManagement.Application.Library;
using SchoolManagement.Application.Library.External;
using SchoolManagement.Application.Payroll;
using SchoolManagement.Application.Alumni;
using SchoolManagement.Application.Staff;
using SchoolManagement.Application.Calendar;
using SchoolManagement.Application.Access;
using SchoolManagement.Application.Audit;
using SchoolManagement.Application.Progression;
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
        var connectionString = configuration.GetConnectionString("SchoolManagement") ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");
        services.AddDbContext<SchoolManagementDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IStudentRepository, StudentRepository>();
        services.AddScoped<IProgrammeRepository, ProgrammeRepository>();
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<ISemesterRepository, SemesterRepository>();
        services.AddScoped<IAcademicRecordRepository, AcademicRecordRepository>();
        services.AddScoped<IAssessmentRepository, AssessmentRepository>();
        services.AddScoped<ICurriculumRepository, CurriculumRepository>();
        services.AddScoped<ICourseRepository, CourseRepository>();
        services.AddScoped<ICurriculumCourseRepository, CurriculumCourseRepository>();
        services.AddScoped<ICourseRegistrationRepository, CourseRegistrationRepository>();
        services.AddScoped<IStudentPromotionRepository, StudentPromotionRepository>();
        services.AddScoped<ISemesterProgressionRepository, SemesterProgressionRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IAttendanceRepository, SchoolManagement.Infrastructure.Repositories.AttendanceRepository>();
        services.AddScoped<IAdmissionRepository, AdmissionRepository>();
        services.AddScoped<SchoolManagement.Application.Abstractions.IFinanceRepository, SchoolManagement.Infrastructure.Repositories.FinanceRepository>();
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
        services.AddScoped<AdmissionService>();
        services.AddScoped<AdmissionsWorkflowService>();
        services.AddScoped<FinanceService>();
        services.AddScoped<FinanceWorkflowService>();
        services.AddScoped<FeeService>();
        services.AddScoped<FeeWorkflowService>();
        services.AddScoped<LibraryService>();
        services.AddScoped<ProgressionWorkflowService>();
        services.AddScoped<ISemesterProgressionService, SemesterProgressionService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AdministrationService>();
        services.AddScoped<ModuleAccessService>();
        services.AddScoped<BulkImportService>();
        services.AddScoped<ReportGenerator>();
        services.AddScoped<CertificateService>();
        services.AddScoped<PayrollService>();
        services.AddScoped<AlumniService>();
        services.AddScoped<LeaveRequestService>();
        services.AddScoped<CalendarEventService>();
        services.AddScoped<GateLogService>();
        services.AddScoped<AuditLogService>();
        services.AddScoped<DatabaseHealthCheck>();
        services.AddSingleton<PasswordHasher>();
        services.AddScoped<AdminSeeder>();
        var librarySettings = new LibraryIntegrationSettings { KohaBaseUrl = configuration["Library:Integrations:KohaBaseUrl"] ?? string.Empty, DSpaceBaseUrl = configuration["Library:Integrations:DSpaceBaseUrl"] ?? string.Empty };
        services.AddLibraryExternalIntegration(librarySettings);
        return services;
    }
}
