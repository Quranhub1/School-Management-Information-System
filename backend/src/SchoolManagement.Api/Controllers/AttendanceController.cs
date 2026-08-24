using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class AttendanceController(AttendanceService service) : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> OpenSession(OpenAttendanceSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await service.OpenSessionAsync(
                request.TimetableEntryId,
                request.SessionDate,
                request.RecordedByUserId,
                request.Remarks,
                cancellationToken);
            return Created($"/api/attendance/sessions/{session.Id}", session);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("sessions/{attendanceSessionId:guid}/records")]
    public async Task<IActionResult> Mark(
        Guid attendanceSessionId,
        MarkAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var record = await service.MarkAsync(
                attendanceSessionId,
                request.StudentId,
                request.Status,
                request.Remarks,
                cancellationToken);
            return Created($"/api/attendance/records/{record.Id}", record);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("students/{studentId:guid}")]
    public async Task<IActionResult> StudentHistory(
        Guid studentId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        return Ok(await service.GetStudentHistoryAsync(studentId, from, to, cancellationToken));
    }
}

public sealed record OpenAttendanceSessionRequest(
    Guid TimetableEntryId,
    DateOnly SessionDate,
    Guid? RecordedByUserId,
    string? Remarks);

public sealed record MarkAttendanceRequest(
    Guid StudentId,
    string Status,
    string? Remarks);
