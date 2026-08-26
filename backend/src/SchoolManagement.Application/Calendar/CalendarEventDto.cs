namespace SchoolManagement.Application.Calendar;

public sealed record CalendarEventDto(
    Guid Id,
    string Title,
    string? Description,
    string EventType,
    DateOnly StartDate,
    DateOnly EndDate,
    string? Location,
    bool IsActive);

public sealed record CreateCalendarEventDto(
    string Title,
    string? Description,
    string EventType,
    DateOnly StartDate,
    DateOnly EndDate,
    string? Location);
