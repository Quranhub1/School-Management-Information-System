using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/timetable")]
[Authorize(Policy = TimetablePolicies.Management)]
public sealed class TimetableController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? teachingGroupId, CancellationToken cancellationToken)
    {
        var query = db.TimetableEntries.AsNoTracking().Where(x => x.IsActive);
        if (teachingGroupId.HasValue) query = query.Where(x => x.TeachingGroupId == teachingGroupId.Value);
        return Ok(await query.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).ToListAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        if (request.EndTime <= request.StartTime) return BadRequest(new { message = "End time must be after start time." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });

        var conflict = await db.TimetableEntries.AnyAsync(x => x.IsActive && x.DayOfWeek == request.DayOfWeek && x.Room == request.Room && x.StartTime < request.EndTime && request.StartTime < x.EndTime, cancellationToken);
        if (conflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        var entry = new Domain.Academic.TimetableEntry { TeachingGroupId = request.TeachingGroupId, DayOfWeek = request.DayOfWeek, StartTime = request.StartTime, EndTime = request.EndTime, Room = request.Room, SessionType = request.SessionType };
        db.TimetableEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/timetable/{entry.Id}", entry);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var entry = await db.TimetableEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return NotFound();
        entry.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateTimetableEntryRequest(Guid TeachingGroupId, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, string? Room, string? SessionType);
