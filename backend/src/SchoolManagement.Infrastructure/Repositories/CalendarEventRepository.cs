using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Calendar;
using SchoolManagement.Domain.Calendar;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CalendarEventRepository(SchoolManagementDbContext db) : ICalendarEventRepository
{
    public async Task<IReadOnlyList<CalendarEvent>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await db.CalendarEvents.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.StartDate).ToListAsync(cancellationToken);

    public Task<CalendarEvent?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.CalendarEvents.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(CalendarEvent calendarEvent, CancellationToken cancellationToken = default) => await db.CalendarEvents.AddAsync(calendarEvent, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
