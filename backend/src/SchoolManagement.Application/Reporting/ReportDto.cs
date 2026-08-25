namespace SchoolManagement.Application.Reporting;

public sealed record ReportDto(
    string ReportType,
    long PrimaryCount,
    IReadOnlyDictionary<string, long> Counts,
    IReadOnlyDictionary<string, decimal> Amounts);

public sealed record ReportMetrics(
    long Students,
    long Staff,
    long Programmes,
    long Courses,
    long AcademicYears,
    long CurrentAcademicYears,
    long ActiveLibraryBooks,
    long ActiveLibraryLoans);

public sealed record FinanceReportMetrics(
    long InvoiceCount,
    long PaymentCount,
    decimal TotalInvoiced,
    decimal TotalPaid);

public sealed record AttendanceReportMetrics(
    long Sessions,
    long StudentAttendanceRecords,
    long AttendanceRecords);

public sealed record AcademicReportMetrics(
    long AcademicYears,
    long Semesters,
    long Programmes,
    long Courses,
    long Registrations,
    long Results);
