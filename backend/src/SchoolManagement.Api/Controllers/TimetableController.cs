using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Timetable;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Timetable;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/timetable")]
[Authorize(Policy = TimetablePolicies.Management)]
public sealed class TimetableController(SchoolManagementDbContext db, TimetableGeneratorService generator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? teachingGroupId, CancellationToken cancellationToken)
    {
        var query = db.TimetableEntries.AsNoTracking().Where(x => x.IsActive);
        if (teachingGroupId.HasValue) query = query.Where(x => x.TeachingGroupId == teachingGroupId.Value);
        return Ok(await query.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).ToListAsync(cancellationToken));
    }

    [HttpGet("conflicts")]
    public async Task<IActionResult> Conflicts([FromQuery] Guid? teachingGroupId, [FromQuery] Guid? semesterId, CancellationToken cancellationToken)
    {
        var query = db.TimetableEntries.AsNoTracking().Where(x => x.IsActive);
        if (teachingGroupId.HasValue) query = query.Where(x => x.TeachingGroupId == teachingGroupId.Value);
        var entries = await query.ToListAsync(cancellationToken);
        var conflicts = entries
            .GroupBy(x => new { x.DayOfWeek, x.Room })
            .Where(g => g.Count() > 1)
            .SelectMany(g => g)
            .ToList();
        return Ok(conflicts);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        if (request.EndTime <= request.StartTime) return BadRequest(new { message = "End time must be after start time." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });
        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId, cancellationToken)) return BadRequest(new { message = "Course not found." });
        if (!await db.StaffMembers.AnyAsync(x => x.Id == request.TeacherId, cancellationToken)) return BadRequest(new { message = "Teacher not found." });

        var conflict = await db.TimetableEntries.AnyAsync(x => x.IsActive && x.DayOfWeek == request.DayOfWeek && x.Room == request.Room && x.StartTime < request.EndTime && request.StartTime < x.EndTime, cancellationToken);
        if (conflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        var entry = new Domain.Academic.TimetableEntry { TeachingGroupId = request.TeachingGroupId, CourseId = request.CourseId, TeacherId = request.TeacherId, DayOfWeek = request.DayOfWeek, StartTime = request.StartTime, EndTime = request.EndTime, Room = request.Room, SessionType = request.SessionType };
        db.TimetableEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/timetable/{entry.Id}", entry);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(GenerateTimetableRequest request, CancellationToken cancellationToken)
    {
        var result = await generator.GenerateAsync(request, cancellationToken);
        return Ok(result);
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

public sealed record CreateTimetableEntryRequest(Guid TeachingGroupId, Guid CourseId, Guid TeacherId, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, string? Room, string? SessionType);
