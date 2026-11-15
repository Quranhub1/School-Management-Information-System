using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff-attendance")]
[Authorize]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class StaffAttendanceController(
    SchoolManagementDbContext db,
    CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet("daily")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> Daily(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? search,
        [FromQuery] Guid? departmentId,
        CancellationToken cancellationToken)
    {
        var kampala = TimeZoneInfo.FindSystemTimeZoneById("Africa/Kampala");
        var todayInKampala = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, kampala).DateTime);
        var firstDate = from ?? todayInKampala;
        var lastDate = to ?? firstDate;
        if (lastDate < firstDate) return BadRequest(new { message = "The end date must be on or after the start date." });
        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(firstDate.ToDateTime(TimeOnly.MinValue), kampala));
        var end = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(lastDate.AddDays(1).ToDateTime(TimeOnly.MinValue), kampala));

        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var staffQuery = db.StaffMembers.AsNoTracking().Where(s => s.IsActive);
        if (accessibleCampuses is not null)
            staffQuery = staffQuery.Where(s => s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value));
        if (departmentId.HasValue) staffQuery = staffQuery.Where(s => s.DepartmentId == departmentId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            staffQuery = staffQuery.Where(s => s.StaffNumber.ToLower().Contains(term)
                || s.FirstName.ToLower().Contains(term) || s.LastName.ToLower().Contains(term));
        }

        var staff = await staffQuery.Select(s => new
        {
            s.Id, s.StaffNumber, s.FirstName, s.LastName, s.DepartmentId
        }).ToListAsync(cancellationToken);
        var staffIds = staff.Select(s => s.Id).ToArray();
        var events = await db.StaffAttendanceEvents.AsNoTracking()
            .Where(e => staffIds.Contains(e.StaffMemberId) && e.RecordedAtUtc >= start && e.RecordedAtUtc < end)
            .OrderBy(e => e.RecordedAtUtc)
            .Select(e => new { e.StaffMemberId, e.EventType, e.RecordedAtUtc })
            .ToListAsync(cancellationToken);

        if (lastDate.DayNumber - firstDate.DayNumber > 365)
            return BadRequest(new { message = "Attendance reports are limited to 366 days per request." });

        var rows = new List<object>();
        for (var date = firstDate; date <= lastDate; date = date.AddDays(1))
        {
            var dayStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(TimeOnly.MinValue), kampala));
            var dayEnd = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(date.AddDays(1).ToDateTime(TimeOnly.MinValue), kampala));
            foreach (var member in staff)
            {
                var memberEvents = events.Where(e => e.StaffMemberId == member.Id
                    && e.RecordedAtUtc >= dayStart && e.RecordedAtUtc < dayEnd).ToArray();
                var checkIn = memberEvents.FirstOrDefault(e => e.EventType == "IN")?.RecordedAtUtc;
                var checkOut = memberEvents.LastOrDefault(e => e.EventType == "OUT")?.RecordedAtUtc;
                var status = checkIn is null ? "Absent" : checkOut is null ? "Checked in" : "Complete";
                double? worked = checkIn.HasValue && checkOut.HasValue && checkOut.Value > checkIn.Value
                    ? (checkOut.Value - checkIn.Value).TotalHours : null;
                rows.Add(new
                {
                    staffMemberId = member.Id,
                    member.StaffNumber,
                    name = string.Join(" ", new[] { member.FirstName, member.LastName }),
                    member.DepartmentId,
                    date,
                    checkIn,
                    checkOut,
                    hoursWorked = worked,
                    status,
                    eventCount = memberEvents.Length
                });
            }
        }
        return Ok(rows);
    }

    /// <summary>
    /// Called by the trusted workstation agent only after local biometric matching succeeds.
    /// The server assigns the authoritative timestamp and derives IN/OUT; callers cannot choose it.
    /// </summary>
    [HttpPost("capture")]
    [Authorize(Policy = StaffPolicies.Management)]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Capture([FromBody] StaffFingerprintCaptureRequest request, CancellationToken cancellationToken)
    {
        if (request.StaffMemberId == Guid.Empty || string.IsNullOrWhiteSpace(request.DeviceId)
            || string.IsNullOrWhiteSpace(request.CaptureId))
            return BadRequest(new { message = "A matched staff member, device ID and capture ID are required." });
        if (request.DeviceId.Length > 100 || request.CaptureId.Length > 160)
            return BadRequest(new { message = "Device or capture identifier is too long." });

        var staff = await db.StaffMembers.SingleOrDefaultAsync(s => s.Id == request.StaffMemberId && s.IsActive, cancellationToken);
        if (staff is null) return NotFound(new { message = "Active staff member was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();

        var duplicate = await db.StaffAttendanceEvents.AnyAsync(e =>
            e.DeviceId == request.DeviceId && e.CaptureId == request.CaptureId, cancellationToken);
        if (duplicate) return Conflict(new { message = "This scanner capture has already been recorded." });

        var now = DateTimeOffset.UtcNow;
        var kampala = TimeZoneInfo.FindSystemTimeZoneById("Africa/Kampala");
        var todayInKampala = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, kampala).DateTime);
        var dayStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(todayInKampala.ToDateTime(TimeOnly.MinValue), kampala));
        var todays = await db.StaffAttendanceEvents.Where(e =>
                e.StaffMemberId == staff.Id && e.RecordedAtUtc >= dayStart)
            .OrderBy(e => e.RecordedAtUtc)
            .ToListAsync(cancellationToken);

        if (todays.Any(e => e.EventType == "OUT"))
            return Conflict(new { message = "Today's check-out is already recorded. Further scans were ignored." });

        var last = todays.LastOrDefault();
        if (last is not null && now - last.RecordedAtUtc < TimeSpan.FromSeconds(30))
            return Conflict(new { message = "Duplicate scan ignored. Please wait before scanning again." });

        var eventType = todays.Any(e => e.EventType == "IN") ? "OUT" : "IN";
        var attendanceEvent = new StaffAttendanceEvent
        {
            StaffMemberId = staff.Id,
            EventType = eventType,
            RecordedAtUtc = now,
            DeviceId = request.DeviceId.Trim(),
            CaptureId = request.CaptureId.Trim()
        };
        db.StaffAttendanceEvents.Add(attendanceEvent);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "This capture was already processed." });
        }

        return Ok(new
        {
            attendanceEvent.Id,
            staffMemberId = staff.Id,
            staffName = $"{staff.FirstName} {staff.LastName}",
            staff.StaffNumber,
            eventType,
            recordedAtUtc = now,
            confirmation = eventType == "IN" ? "Check-in recorded" : "Check-out recorded"
        });
    }
}

public sealed record StaffFingerprintCaptureRequest(Guid StaffMemberId, string DeviceId, string CaptureId);
