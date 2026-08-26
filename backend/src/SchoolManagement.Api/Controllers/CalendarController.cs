using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/calendar")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CalendarController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var query = db.CalendarEvents.AsNoTracking().Where(x => x.IsActive);
        return Ok(await query.OrderBy(x => x.StartDate).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var calendarEvent = await db.CalendarEvents.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return calendarEvent is null ? NotFound() : Ok(calendarEvent);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCalendarEventRequest request, CancellationToken cancellationToken)
    {
        if (request.EndDate < request.StartDate) return BadRequest(new { message = "End date must be after start date." });

        var calendarEvent = new Domain.Calendar.CalendarEvent
        {
            Title = request.Title,
            Description = request.Description,
            EventType = request.EventType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Location = request.Location,
            IsActive = true
        };
        db.CalendarEvents.Add(calendarEvent);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/calendar/{calendarEvent.Id}", calendarEvent);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var calendarEvent = await db.CalendarEvents.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (calendarEvent is null) return NotFound();
        calendarEvent.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateCalendarEventRequest(string Title, string? Description, string EventType, DateOnly StartDate, DateOnly EndDate, string? Location);
