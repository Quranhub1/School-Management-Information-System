namespace SchoolManagement.Application.Timetable;

public sealed record TimetableEntryDto(
    Guid Id,
    Guid TeachingGroupId,
    Guid CourseId,
    Guid TeacherId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room,
    string? SessionType,
    bool IsActive,
    DateTimeOffset? GeneratedAt,
    string? GenerationSource);

public sealed record CreateTimetableEntryDto(
    Guid TeachingGroupId,
    Guid CourseId,
    Guid TeacherId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room,
    string? SessionType);

public sealed record GenerateTimetableRequest(
    Guid SemesterId,
    Guid? TeachingGroupId,
    int RotationIntervalMinutes,
    string? GenerationSource);

public sealed record GeneratedTimetableResult(
    IReadOnlyList<TimetableEntryDto> Entries,
    IReadOnlyList<string> Conflicts,
    IReadOnlyList<string> Warnings,
    double OptimizationScore,
    IReadOnlyList<string> Unscheduled,
    bool IsConflictFree);
