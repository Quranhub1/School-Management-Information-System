namespace SchoolManagement.Infrastructure.Analytics;

public sealed record CourseAnalytics(
    Guid CourseId,
    string CourseCode,
    string CourseTitle,
    decimal? AverageScore,
    decimal? MedianScore,
    decimal PassRate,
    decimal FailRate,
    IReadOnlyDictionary<string, int> GradeDistribution);

public sealed record SemesterAnalytics(
    Guid SemesterId,
    IReadOnlyList<CourseAnalytics> Courses,
    decimal? OverallAverage,
    decimal OverallPassRate);

public sealed record StudentRiskAnalytics(
    Guid StudentId,
    string StudentName,
    decimal? AverageScore,
    decimal? AttendancePercentage,
    string RiskLevel,
    IReadOnlyList<string> RiskFactors);
