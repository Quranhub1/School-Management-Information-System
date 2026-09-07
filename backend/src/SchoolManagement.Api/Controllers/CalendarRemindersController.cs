using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Calendar;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/calendar/{eventId:guid}/reminders")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CalendarRemindersController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid eventId, CancellationToken cancellationToken)
    {
        var reminders = await db.Set<CalendarReminder>().AsNoTracking()
            .Where(r => r.CalendarEventId == eventId).OrderBy(r => r.RemindOnUtc)
            .Select(r => new { r.Id, r.CalendarEventId, r.RecipientType, r.RecipientId, r.Message, r.Channel, r.IsSent, r.RemindOnUtc, r.SentAtUtc, r.CreatedAtUtc })
            .ToListAsync(cancellationToken);
        return Ok(reminders);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid eventId, [FromBody] CreateCalendarReminderRequest request, CancellationToken cancellationToken)
    {
        if (!await db.CalendarEvents.AnyAsync(e => e.Id == eventId, cancellationToken)) return NotFound(new { message = "Calendar event not found." });
        var reminder = new CalendarReminder
        {
            CalendarEventId = eventId, RecipientType = request.RecipientType.Trim(), RecipientId = request.RecipientId,
            Message = request.Message, RemindOnUtc = request.RemindOnUtc, Channel = request.Channel.Trim(), IsSent = false
        };
        db.Set<CalendarReminder>().Add(reminder);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(List), new { eventId }, new { reminder.Id });
    }

    [HttpPost("{id:guid}/send")]
    public async Task<IActionResult> MarkAsSent(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var reminder = await db.Set<CalendarReminder>().FirstOrDefaultAsync(r => r.Id == id && r.CalendarEventId == eventId, cancellationToken);
        if (reminder is null) return NotFound();
        reminder.IsSent = true; reminder.SentAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Reminder marked as sent." });
    }
}

public sealed record CreateCalendarReminderRequest(string RecipientType, string? RecipientId, string? Message, DateOnly RemindOnUtc, string Channel = "InApp");
