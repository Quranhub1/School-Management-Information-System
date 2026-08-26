namespace SchoolManagement.Application.Reporting;

public sealed class ReportGenerator : IReportService
{
    public ReportDto BuildSummary(ReportMetrics metrics) =>
        new("summary", metrics.Students,
            new Dictionary<string, long>
            {
                ["students"] = metrics.Students,
                ["staff"] = metrics.Staff,
                ["programmes"] = metrics.Programmes,
                ["courses"] = metrics.Courses,
                ["academicYears"] = metrics.AcademicYears,
                ["currentAcademicYears"] = metrics.CurrentAcademicYears,
                ["activeLibraryBooks"] = metrics.ActiveLibraryBooks,
                ["activeLibraryLoans"] = metrics.ActiveLibraryLoans
            },
            new Dictionary<string, decimal>());

    public ReportDto BuildFinanceSummary(FinanceReportMetrics metrics) =>
        new("finance", metrics.InvoiceCount,
            new Dictionary<string, long>
            {
                ["invoiceCount"] = metrics.InvoiceCount,
                ["paymentCount"] = metrics.PaymentCount
            },
            new Dictionary<string, decimal>
            {
                ["totalInvoiced"] = metrics.TotalInvoiced,
                ["totalPaid"] = metrics.TotalPaid,
                ["outstanding"] = metrics.TotalInvoiced - metrics.TotalPaid
            });

    public ReportDto BuildAttendanceSummary(AttendanceReportMetrics metrics) =>
        new("attendance", metrics.Sessions,
            new Dictionary<string, long>
            {
                ["sessions"] = metrics.Sessions,
                ["studentAttendanceRecords"] = metrics.StudentAttendanceRecords,
                ["attendanceRecords"] = metrics.AttendanceRecords
            },
            new Dictionary<string, decimal>());

    public ReportDto BuildAcademicSummary(AcademicReportMetrics metrics) =>
        new("academic", metrics.AcademicYears,
            new Dictionary<string, long>
            {
                ["academicYears"] = metrics.AcademicYears,
                ["semesters"] = metrics.Semesters,
                ["programmes"] = metrics.Programmes,
                ["courses"] = metrics.Courses,
                ["registrations"] = metrics.Registrations,
                ["results"] = metrics.Results
            },
            new Dictionary<string, decimal>());
}
