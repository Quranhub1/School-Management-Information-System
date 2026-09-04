namespace SchoolManagement.Infrastructure.Analytics;

public sealed record DashboardStats(
    int TotalStudents,
    int ActiveStudents,
    int PendingAdmissions,
    decimal AttendanceRate,
    decimal OutstandingFees,
    decimal? ExamPerformance,
    decimal? PlacementCompletion,
    int CertificatesIssued,
    int WorkflowItemsAwaitingAction);

public sealed record StatItem(
    string Label,
    string Value,
    string Unit);
