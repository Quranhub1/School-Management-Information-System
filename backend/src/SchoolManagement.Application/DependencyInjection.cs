using Microsoft.Extensions.DependencyInjection;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Application.HR;
using SchoolManagement.Application.ImportExport;
using SchoolManagement.Application.Certificates;
using SchoolManagement.Application.Payroll;
using SchoolManagement.Application.Alumni;
using SchoolManagement.Application.Staff;
using SchoolManagement.Application.Calendar;
using SchoolManagement.Application.Access;
using SchoolManagement.Application.Audit;
using SchoolManagement.Application.Library;
using SchoolManagement.Application.Progression;
using SchoolManagement.Application.StudentRecords;
using SchoolManagement.Application.Students;
using SchoolManagement.Application.Timetable;

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
        services.AddScoped<AttendanceWorkflowService>();
        services.AddScoped<AdmissionService>();
        services.AddScoped<AdmissionsWorkflowService>();
        services.AddScoped<FinanceService>();
        services.AddScoped<FinanceWorkflowService>();
        services.AddScoped<InvoiceDiscountService>();
        services.AddScoped<InvoiceInstallmentService>();
        services.AddScoped<StudentChargeService>();
        services.AddScoped<CreditNoteRefundService>();
        services.AddScoped<FinanceReportService>();
        services.AddScoped<JournalReversalService>();
        services.AddScoped<FeeService>();
        services.AddScoped<FeeWorkflowService>();
        services.AddScoped<LibraryService>();
        services.AddScoped<LibraryWorkflowService>();
        services.AddScoped<InstitutionSettingsService>();
        services.AddScoped<ProgressionWorkflowService>();
        services.AddScoped<ISemesterProgressionService, SemesterProgressionService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AdministrationService>();
        services.AddScoped<ModuleAccessService>();
        services.AddScoped<BulkImportService>();
        services.AddScoped<CertificateService>();
        services.AddScoped<PayrollService>();
        services.AddScoped<AlumniService>();
        services.AddScoped<LeaveRequestService>();
        services.AddScoped<CalendarEventService>();
        services.AddScoped<GateLogService>();
        services.AddScoped<AuditLogService>();
        services.AddScoped<AssessmentWorkflowService>();
        services.AddScoped<HrWorkflowService>();
        services.AddScoped<StudentRecordsWorkflowService>();
        services.AddScoped<TimetableWorkflowService>();
        return services;
    }
}
