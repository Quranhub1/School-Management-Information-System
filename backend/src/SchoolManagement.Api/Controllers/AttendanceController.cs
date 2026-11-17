using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public sealed class AttendanceController(
    AttendanceService service,
    SchoolManagementDbContext db,
    CampusAccessService campusAccess) : ControllerBase
{
    [HttpPost("sessions")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> OpenSession(
        OpenAttendanceSessionRequest request,
        CancellationToken cancellationToken)
    {
        var timetableCampusId = await GetTimetableCampusIdAsync(request.TimetableEntryId, cancellationToken);
        if (timetableCampusId is null && !await db.TimetableEntries.AnyAsync(x => x.Id == request.TimetableEntryId, cancellationToken))
            return NotFound(new { message = "Timetable entry was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, timetableCampusId, cancellationToken)) return Forbid();

        try
        {
            var session = await service.OpenSessionAsync(request.TimetableEntryId, request.SessionDate, request.RecordedByUserId, request.Remarks, cancellationToken);
            return Created($"/api/attendance/sessions/{session.Id}", session);
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

    [HttpPost("sessions/{attendanceSessionId:guid}/close")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> CloseSession(
        Guid attendanceSessionId,
        CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
        try
        {
            var session = await service.CloseSessionAsync(attendanceSessionId, cancellationToken);
            return Ok(session);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("sessions/{attendanceSessionId:guid}/records")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> Mark(
        Guid attendanceSessionId,
        [FromBody] MarkAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var campusError = await ValidateAttendanceCampusAsync(attendanceSessionId, request.StudentId, cancellationToken);
        if (campusError is not null) return campusError;
        try
        {
            var status = Enum.TryParse<AttendanceStatus>(request.Status, true, out var parsed)
                ? parsed
                : AttendanceStatus.Present;
            var record = await service.MarkAsync(attendanceSessionId, request.StudentId, status, request.Remarks, cancellationToken);
            return Created($"/api/attendance/records/{record.Id}", record);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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

    [HttpPost("sessions/{attendanceSessionId:guid}/bulk-mark")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> BulkMark(
        Guid attendanceSessionId,
        [FromBody] BulkMarkAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();

        try
        {
            var marks = request.Marks.Select(m => new BulkMarkRequest(
                m.StudentId,
                Enum.TryParse<AttendanceStatus>(m.Status, true, out var parsed) ? parsed : AttendanceStatus.Present,
                m.Remarks)).ToList();
            var records = await service.MarkBulkAsync(attendanceSessionId, marks, cancellationToken);
            return Ok(new
            {
                markedCount = records.Count,
                records = records.Select(r => new
                {
                    r.Id,
                    r.StudentId,
                    Status = r.Status.ToString(),
                    r.Remarks
                })
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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

    [HttpGet("sessions/{attendanceSessionId:guid}/eligible-students")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> GetEligibleStudents(
        Guid attendanceSessionId,
        CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();

        var students = await service.GetEligibleStudentsAsync(attendanceSessionId, cancellationToken);
        return Ok(students.Select(s => new
        {
            s.StudentId,
            s.StudentNumber,
            s.FirstName,
            s.LastName,
            s.OtherNames,
            s.DisplayName,
            s.CampusId,
            s.AlreadyMarked
        }));
    }

    [HttpGet("sessions/{attendanceSessionId:guid}/summary")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> GetSessionSummary(
        Guid attendanceSessionId,
        CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();

        var summary = await service.GetSessionSummaryAsync(attendanceSessionId, cancellationToken);
        return Ok(new
        {
            summary.SessionId,
            summary.TimetableEntryId,
            summary.SessionDate,
            Status = summary.Status.ToString(),
            summary.TotalEnrolled,
            summary.MarkedPresent,
            summary.MarkedAbsent,
            summary.MarkedLate,
            summary.MarkedExcused,
            summary.Unmarked,
            summary.AttendancePercentage
        });
    }

    [HttpGet("students/{studentId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> StudentHistory(
        Guid studentId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        return Ok(await service.GetStudentHistoryAsync(studentId, from, to, cancellationToken));
    }

    private async Task<Guid?> GetTimetableCampusIdAsync(Guid timetableEntryId, CancellationToken cancellationToken)
        => await (from entry in db.TimetableEntries.AsNoTracking()
                  join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
                  where entry.Id == timetableEntryId
                  select staff.CampusId).SingleOrDefaultAsync(cancellationToken);

    private async Task<Guid?> GetSessionCampusIdAsync(Guid sessionId, CancellationToken cancellationToken)
        => await (from session in db.AttendanceSessions.AsNoTracking()
                  join entry in db.TimetableEntries.AsNoTracking() on session.TimetableEntryId equals entry.Id
                  join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
                  where session.Id == sessionId
                  select staff.CampusId).SingleOrDefaultAsync(cancellationToken);

    private async Task<IActionResult?> ValidateAttendanceCampusAsync(
        Guid sessionId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var sessionCampusId = await GetSessionCampusIdAsync(sessionId, cancellationToken);
        if (sessionCampusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == sessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, sessionCampusId, cancellationToken)) return Forbid();
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();

        var studentCampusId = await db.Students.AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => x.CampusId)
            .SingleOrDefaultAsync(cancellationToken);
        if (sessionCampusId.HasValue && studentCampusId.HasValue && sessionCampusId.Value != studentCampusId.Value)
            return BadRequest(new { message = "Attendance can only be recorded for students assigned to the session's campus." });
        return null;
    }

}

public sealed record OpenAttendanceSessionRequest(Guid TimetableEntryId, DateOnly SessionDate, Guid? RecordedByUserId, string? Remarks);
public sealed record MarkAttendanceRequest(Guid StudentId, string Status, string? Remarks);
public sealed record BulkMarkAttendanceRequest(List<BulkMarkAttendanceItem> Marks);
public sealed record BulkMarkAttendanceItem(Guid StudentId, string Status, string? Remarks);
