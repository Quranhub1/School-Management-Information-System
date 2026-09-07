using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class AttendanceController(AttendanceService service, IConfiguration configuration) : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> OpenSession(OpenAttendanceSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var session = await service.OpenSessionAsync(request.TimetableEntryId, request.SessionDate, request.RecordedByUserId, request.Remarks, cancellationToken);
            return Created($"/api/attendance/sessions/{session.Id}", session);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpGet("sessions/{attendanceSessionId:guid}/qr")]
    public IActionResult GetRotatingQrToken(Guid attendanceSessionId)
    {
        var now = DateTimeOffset.UtcNow;
        var slot = now.ToUnixTimeSeconds() / 60;
        var token = CreateQrToken(attendanceSessionId, slot);

        return Ok(new
        {
            attendanceSessionId,
            token,
            expiresAtUtc = DateTimeOffset.FromUnixTimeSeconds((slot + 1) * 60),
            rotationSeconds = 60,
            scheme = "SMIS-ATTENDANCE-V1"
        });
    }

    [HttpPost("sessions/{attendanceSessionId:guid}/qr-records")]
    public async Task<IActionResult> MarkWithQr(Guid attendanceSessionId, MarkQrAttendanceRequest request, CancellationToken cancellationToken)
    {
        if (!IsValidQrToken(attendanceSessionId, request.Token))
            return Unauthorized(new { message = "The attendance QR code is invalid or has expired. Scan the current code and try again." });

        try
        {
            var record = await service.MarkAsync(attendanceSessionId, request.StudentId, request.Status ?? "Present", request.Remarks, cancellationToken);
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

    [HttpPost("sessions/{attendanceSessionId:guid}/records")]
    public async Task<IActionResult> Mark(Guid attendanceSessionId, MarkAttendanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var record = await service.MarkAsync(attendanceSessionId, request.StudentId, request.Status, request.Remarks, cancellationToken);
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
    public async Task<IActionResult> StudentHistory(Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
        => Ok(await service.GetStudentHistoryAsync(studentId, from, to, cancellationToken));

    private string CreateQrToken(Guid sessionId, long slot)
    {
        var secret = configuration["Security:AttendanceQrSecret"]
            ?? Environment.GetEnvironmentVariable("SMIS_ATTENDANCE_QR_SECRET");
        if (string.IsNullOrWhiteSpace(secret))
            throw new InvalidOperationException("Attendance QR security secret is not configured. Set SMIS_ATTENDANCE_QR_SECRET on the server.");

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var payload = $"SMIS-ATTENDANCE-V1|{sessionId:N}|{slot}";
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLowerInvariant();
    }

    private bool IsValidQrToken(Guid sessionId, string? suppliedToken)
    {
        if (string.IsNullOrWhiteSpace(suppliedToken)) return false;

        var currentSlot = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 60;
        foreach (var slot in new[] { currentSlot, currentSlot - 1 })
        {
            var expected = CreateQrToken(sessionId, slot);
            if (CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(suppliedToken.Trim().ToLowerInvariant())))
                return true;
        }
        return false;
    }
}

public sealed record OpenAttendanceSessionRequest(Guid TimetableEntryId, DateOnly SessionDate, Guid? RecordedByUserId, string? Remarks);
public sealed record MarkAttendanceRequest(Guid StudentId, string Status, string? Remarks);
public sealed record MarkQrAttendanceRequest(Guid StudentId, string? Status, string? Remarks, string Token);
