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

public sealed record StudentReportCardDto(
    string StudentNumber,
    string StudentName,
    IReadOnlyList<ResultEntry> Results,
    decimal GPA)
{
    public sealed record ResultEntry(string CourseCode, string CourseName, decimal? Score, string? Grade, decimal? GradePoint, string Status, bool IsFinal);
}

public sealed record FeeReceiptDto(
    Guid Id,
    Guid StudentInvoiceId,
    string InvoiceNumber,
    Guid StudentId,
    string ReceiptNumber,
    decimal Amount,
    string Currency,
    string PaymentMethod,
    string Reference,
    DateTimeOffset PaidAt);

public sealed record AttendanceReportDto(
    Guid ClassId,
    DateOnly From,
    DateOnly To,
    int SessionCount,
    int RecordCount,
    IReadOnlyDictionary<string, int> StatusSummary,
    IReadOnlyList<SessionSummary> Sessions)
{
    public sealed record SessionSummary(Guid SessionId, DateOnly Date, string Status, int AttendanceCount);
}

public sealed record FinancialStatementDto(
    string Period,
    decimal TotalRevenue,
    decimal TotalCollected,
    decimal TotalExpenses,
    decimal OutstandingRevenue,
    decimal NetSurplus,
    IReadOnlyList<PlEntry> ProfitAndLoss)
{
    public sealed record PlEntry(string Description, decimal Amount);
}
