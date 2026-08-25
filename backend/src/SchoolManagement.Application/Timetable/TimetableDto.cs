namespace SchoolManagement.Application.Timetable;

public sealed record TimetableEntryDto(
    Guid Id,
    Guid TeachingGroupId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room,
    string? SessionType,
    bool IsActive);

public sealed record CreateTimetableEntryDto(
    Guid TeachingGroupId,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Room,
    string? SessionType);
