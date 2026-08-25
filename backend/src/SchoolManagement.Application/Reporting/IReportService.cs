namespace SchoolManagement.Application.Reporting;

/// <summary>
/// Application contract for building institutional reports from already retrieved metrics.
/// Data access remains outside the application service.
/// </summary>
public interface IReportService
{
    ReportDto BuildSummary(ReportMetrics metrics);

    ReportDto BuildFinanceSummary(FinanceReportMetrics metrics);

    ReportDto BuildAttendanceSummary(AttendanceReportMetrics metrics);

    ReportDto BuildAcademicSummary(AcademicReportMetrics metrics);
}
