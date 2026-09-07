namespace SchoolManagement.Infrastructure.Analytics;

public sealed record TeacherWorkload(
    Guid TeacherId,
    string TeacherName,
    string Department,
    decimal TeachingHours,
    int SessionsPerWeek,
    int CoursesAssigned,
    int CohortsAssigned,
    int PracticalSessions,
    int AssessmentCount,
    int AttendanceResponsibilities,
    int ExamResponsibilities,
    decimal WorkloadScore,
    string WarningLevel);

public sealed record DepartmentWorkloadSummary(
    Guid DepartmentId,
    string DepartmentName,
    int TotalTeachers,
    decimal AverageWorkload,
    decimal HighestWorkload,
    decimal LowestWorkload);
