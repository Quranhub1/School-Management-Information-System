using SchoolManagement.Domain.Calendar;

namespace SchoolManagement.Application.Calendar;

public sealed class CalendarEventService(ICalendarEventRepository calendarEventRepository)
{
    public async Task<IReadOnlyList<CalendarEvent>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await calendarEventRepository.GetActiveAsync(cancellationToken);

    public async Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await calendarEventRepository.GetByIdAsync(id, cancellationToken);

    public async Task<CalendarEvent> CreateAsync(string title, string? description, string eventType, DateOnly startDate, DateOnly endDate, string? location, CancellationToken cancellationToken = default)
    {
        var calendarEvent = new CalendarEvent
        {
            Title = title,
            Description = description,
            EventType = eventType,
            StartDate = startDate,
            EndDate = endDate,
            Location = location,
            IsActive = true
        };
        await calendarEventRepository.AddAsync(calendarEvent, cancellationToken);
        await calendarEventRepository.SaveChangesAsync(cancellationToken);
        return calendarEvent;
    }
}
