using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using System.Collections.Concurrent;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class AttendanceController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, AttendanceRecord> Records = new();

    [HttpGet]
    public ActionResult<IReadOnlyCollection<AttendanceRecord>> Get([FromQuery] DateOnly? date, [FromQuery] string? studentId)
    {
        var query = Records.Values.AsEnumerable();
        if (date.HasValue) query = query.Where(x => x.Date == date.Value);
        if (!string.IsNullOrWhiteSpace(studentId)) query = query.Where(x => x.StudentId == studentId);
        return Ok(query.OrderByDescending(x => x.Date).ThenBy(x => x.StudentId).ToArray());
    }

    [HttpPost]
    public ActionResult<AttendanceRecord> Mark(MarkAttendanceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentId))
            return BadRequest(new { message = "StudentId is required." });
        if (string.IsNullOrWhiteSpace(request.CourseCode))
            return BadRequest(new { message = "CourseCode is required." });

        var key = $"{request.StudentId}:{request.CourseCode}:{request.Date:yyyy-MM-dd}";
        var record = new AttendanceRecord(
            request.StudentId.Trim(), request.CourseCode.Trim().ToUpperInvariant(),
            request.Date, request.Status, DateTimeOffset.UtcNow);

        if (!Records.TryAdd(key, record))
            return Conflict(new { message = "Attendance has already been recorded for this student, course and date." });

        return Created($"/api/attendance/{key}", record);
    }
}

public sealed record MarkAttendanceRequest(string StudentId, string CourseCode, DateOnly Date, AttendanceStatus Status);
public sealed record AttendanceRecord(string StudentId, string CourseCode, DateOnly Date, AttendanceStatus Status, DateTimeOffset RecordedAt);
public enum AttendanceStatus { Present, Absent, Late, Excused }
