using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Services;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Attendance;
using System.IdentityModel.Tokens.Jwt;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance-qr")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class AttendanceQrController(AttendanceQrService qrService, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GenerateQrRequest request, CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(request.AttendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == request.AttendanceSessionId, cancellationToken)) return NotFound();
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
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
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken)) return NotFound();
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
        var qrSession = await qrService.GetQrSessionAsync(attendanceSessionId, cancellationToken);
        if (qrSession is null)
        {
            return NotFound();
        }

        return Ok(new { qrSession.AttendanceSessionId, qrSession.QrToken, qrSession.GeneratedAt, qrSession.ExpiresAt, qrSession.RotationIntervalMinutes });
    }

    private async Task<Guid?> GetSessionCampusIdAsync(Guid sessionId, CancellationToken cancellationToken)
        => await (from session in db.AttendanceSessions.AsNoTracking()
                  join entry in db.TimetableEntries.AsNoTracking() on session.TimetableEntryId equals entry.Id
                  join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
                  where session.Id == sessionId
                  select staff.CampusId).SingleOrDefaultAsync(cancellationToken);
}

public sealed record GenerateQrRequest(Guid AttendanceSessionId, int RotationIntervalMinutes);

public sealed record ValidateQrRequest(string QrToken);
