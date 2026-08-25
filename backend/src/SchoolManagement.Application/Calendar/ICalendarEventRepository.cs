using SchoolManagement.Domain.Calendar;

namespace SchoolManagement.Application.Calendar;

public interface ICalendarEventRepository
{
    Task<IReadOnlyList<CalendarEvent>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(CalendarEvent calendarEvent, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
