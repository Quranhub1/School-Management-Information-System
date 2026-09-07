using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Attendance;
using System.IdentityModel.Tokens.Jwt;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance-qr")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class AttendanceQrController(AttendanceQrService qrService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateQrRequest request, CancellationToken cancellationToken)
    {
        var result = await qrService.GenerateQrAsync(request.AttendanceSessionId, request.RotationIntervalMinutes, cancellationToken);
        return Ok(new { qrToken = result.QrToken, expiresAt = result.ExpiresAt, rotationIntervalMinutes = request.RotationIntervalMinutes });
    }

    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateQrRequest request, CancellationToken cancellationToken)
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var userId))
        {
            return Unauthorized();
        }

        var result = await qrService.ValidateQrAsync(request.QrToken, userId, cancellationToken);
        return Ok(new { success = result.Success, message = result.Message });
    }

    [HttpGet("session/{attendanceSessionId:guid}")]
    public async Task<IActionResult> GetActiveBySession(Guid attendanceSessionId, CancellationToken cancellationToken)
    {
        var qrSession = await qrService.GetQrSessionAsync(attendanceSessionId, cancellationToken);
        if (qrSession is null)
        {
            return NotFound();
        }

        return Ok(new { qrSession.AttendanceSessionId, qrSession.QrToken, qrSession.GeneratedAt, qrSession.ExpiresAt, qrSession.RotationIntervalMinutes });
    }
}

public sealed record GenerateQrRequest(Guid AttendanceSessionId, int RotationIntervalMinutes);

public sealed record ValidateQrRequest(string QrToken);
