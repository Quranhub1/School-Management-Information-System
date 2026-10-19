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
[Authorize]
public sealed class TimetableController(SchoolManagementDbContext db, TimetableGeneratorService generator) : ControllerBase
{
    [HttpGet("options")]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> Options(CancellationToken cancellationToken)
    {
        var teachingGroups = await db.TeachingGroups.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.GroupCode)
            .Select(x => new { x.Id, Label = x.Name == null || x.Name == "" ? x.GroupCode : x.GroupCode + " — " + x.Name })
            .ToListAsync(cancellationToken);
        var courses = await db.Courses.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Code)
            .Select(x => new { x.Id, Label = x.Code + " — " + x.Name })
            .ToListAsync(cancellationToken);
        var teachers = await db.StaffMembers.AsNoTracking()
            .Where(x => x.IsActive && x.EmploymentStatus == "Active")
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new { x.Id, Label = x.FirstName + " " + x.LastName + " (" + x.StaffNumber + ")" })
            .ToListAsync(cancellationToken);
        var semesters = await db.Semesters.AsNoTracking()
            .OrderByDescending(x => x.IsCurrent).ThenByDescending(x => x.StartDate)
            .Select(x => new { x.Id, Label = x.Name, x.AcademicYearId, x.IsCurrent, x.IsActive })
            .ToListAsync(cancellationToken);
        return Ok(new { teachingGroups, courses, teachers, semesters });
    }

    [HttpGet]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> Get([FromQuery] Guid? teachingGroupId, CancellationToken cancellationToken)
    {
        var query = db.TimetableEntries.AsNoTracking().Where(x => x.IsActive);
        if (teachingGroupId.HasValue) query = query.Where(x => x.TeachingGroupId == teachingGroupId.Value);
        return Ok(await query.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).ToListAsync(cancellationToken));
    }

    [HttpGet("conflicts")]
    [Authorize(Policy = TimetablePolicies.Read)]
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
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Create(CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        if (request.EndTime <= request.StartTime) return BadRequest(new { message = "End time must be after start time." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });
        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId, cancellationToken)) return BadRequest(new { message = "Course not found." });
        if (!await db.StaffMembers.AnyAsync(x => x.Id == request.TeacherId, cancellationToken)) return BadRequest(new { message = "Teacher not found." });

        var conflict = await db.TimetableEntries.AnyAsync(x => x.IsActive && x.DayOfWeek == request.DayOfWeek && x.Room == request.Room && x.StartTime < request.EndTime && request.StartTime < x.EndTime, cancellationToken);
        if (conflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        var entry = new Domain.Academic.TimetableEntry { TeachingGroupId = request.TeachingGroupId, CourseId = request.CourseId, TeacherId = request.TeacherId, StaffMemberId = request.TeacherId, DayOfWeek = request.DayOfWeek, StartTime = request.StartTime, EndTime = request.EndTime, Room = request.Room, SessionType = request.SessionType };
        db.TimetableEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/timetable/{entry.Id}", entry);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Update(Guid id, CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        if (request.EndTime <= request.StartTime) return BadRequest(new { message = "End time must be after start time." });
        var existing = await db.TimetableEntries.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (existing is null) return NotFound(new { message = "Timetable session was not found or has already changed." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });
        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Course not found." });
        if (!await db.StaffMembers.AnyAsync(x => x.Id == request.TeacherId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teacher not found." });

        var conflict = await db.TimetableEntries.AnyAsync(x => x.IsActive && x.Id != id && x.DayOfWeek == request.DayOfWeek && x.Room == request.Room && x.StartTime < request.EndTime && request.StartTime < x.EndTime, cancellationToken);
        if (conflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        // Timetable fields are immutable in the domain model, so replace the row atomically.
        existing.IsActive = false;
        var updated = new Domain.Academic.TimetableEntry
        {
            TeachingGroupId = request.TeachingGroupId,
            CourseId = request.CourseId,
            TeacherId = request.TeacherId,
            StaffMemberId = request.TeacherId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Room = request.Room,
            SessionType = request.SessionType,
            GenerationSource = "TemplateEditor"
        };
        db.TimetableEntries.Add(updated);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(updated);
    }


    [HttpPut("template/{teachingGroupId:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> SaveTemplate(Guid teachingGroupId, SaveTimetableTemplateRequest request, CancellationToken cancellationToken)
    {
        if (request.TeachingGroupId != teachingGroupId)
            return BadRequest(new { message = "The template class does not match the route." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == teachingGroupId && x.IsActive, cancellationToken))
            return BadRequest(new { message = "Teaching group not found." });

        var proposed = request.Entries ?? [];
        foreach (var entry in proposed)
        {
            if (entry.TeachingGroupId != teachingGroupId)
                return BadRequest(new { message = "Every session must belong to the selected class." });
            if (!Enum.IsDefined(entry.DayOfWeek))
                return BadRequest(new { message = "A session contains an invalid day of week." });
            if (entry.EndTime <= entry.StartTime)
                return BadRequest(new { message = "Every session must end after it starts." });
            if (!await db.Courses.AnyAsync(x => x.Id == entry.CourseId && x.IsActive, cancellationToken))
                return BadRequest(new { message = "A selected course was not found or is inactive." });
            if (!await db.StaffMembers.AnyAsync(x => x.Id == entry.TeacherId && x.IsActive && x.EmploymentStatus == "Active", cancellationToken))
                return BadRequest(new { message = "A selected teacher was not found or is inactive." });
        }

        for (var i = 0; i < proposed.Count; i++)
        {
            for (var j = i + 1; j < proposed.Count; j++)
            {
                if (HasOverlap(proposed[i], proposed[j]))
                    return Conflict(new { message = "The template contains overlapping class, teacher, or room assignments." });
            }
        }

        var existingOtherGroups = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.IsActive && x.TeachingGroupId != teachingGroupId)
            .ToListAsync(cancellationToken);
        if (proposed.Any(item => existingOtherGroups.Any(other => HasOverlap(item, other))))
            return Conflict(new { message = "The template conflicts with another class, teacher, or room already scheduled." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var oldEntries = await db.TimetableEntries
            .Where(x => x.IsActive && x.TeachingGroupId == teachingGroupId)
            .ToListAsync(cancellationToken);
        foreach (var old in oldEntries) old.IsActive = false;

        var replacement = proposed.Select(item => new Domain.Academic.TimetableEntry
        {
            TeachingGroupId = teachingGroupId,
            CourseId = item.CourseId,
            TeacherId = item.TeacherId,
            StaffMemberId = item.TeacherId,
            DayOfWeek = item.DayOfWeek,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            Room = string.IsNullOrWhiteSpace(item.Room) ? null : item.Room.Trim(),
            SessionType = item.SessionType,
            GenerationSource = "TemplateEditor"
        }).ToList();
        db.TimetableEntries.AddRange(replacement);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(replacement);
    }

    private static bool HasOverlap(CreateTimetableEntryRequest left, CreateTimetableEntryRequest right)
    {
        if (left.DayOfWeek != right.DayOfWeek || left.StartTime >= right.EndTime || right.StartTime >= left.EndTime)
            return false;
        var sameClass = left.TeachingGroupId == right.TeachingGroupId;
        var sameTeacher = left.TeacherId == right.TeacherId;
        var sameRoom = !string.IsNullOrWhiteSpace(left.Room) && !string.IsNullOrWhiteSpace(right.Room)
            && string.Equals(left.Room.Trim(), right.Room.Trim(), StringComparison.OrdinalIgnoreCase);
        return sameClass || sameTeacher || sameRoom;
    }

    private static bool HasOverlap(CreateTimetableEntryRequest proposed, Domain.Academic.TimetableEntry existing)
    {
        if (proposed.DayOfWeek != existing.DayOfWeek || proposed.StartTime >= existing.EndTime || existing.StartTime >= proposed.EndTime)
            return false;
        var sameClass = proposed.TeachingGroupId == existing.TeachingGroupId;
        var sameTeacher = proposed.TeacherId == existing.TeacherId;
        var sameRoom = !string.IsNullOrWhiteSpace(proposed.Room) && !string.IsNullOrWhiteSpace(existing.Room)
            && string.Equals(proposed.Room.Trim(), existing.Room.Trim(), StringComparison.OrdinalIgnoreCase);
        return sameClass || sameTeacher || sameRoom;
    }

    [HttpPost("generate")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Generate(GenerateTimetableRequest request, CancellationToken cancellationToken)
    {
        var result = await generator.GenerateAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var entry = await db.TimetableEntries.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entry is null) return NotFound();
        entry.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateTimetableEntryRequest(Guid TeachingGroupId, Guid CourseId, Guid TeacherId, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, string? Room, string? SessionType);\npublic sealed record SaveTimetableTemplateRequest(Guid TeachingGroupId, List<CreateTimetableEntryRequest> Entries);
