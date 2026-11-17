using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Services;
using SchoolManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public sealed class AttendanceController(AttendanceService service, IConfiguration configuration, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpPost("sessions")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> OpenSession(OpenAttendanceSessionRequest request, CancellationToken cancellationToken)
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
    public async Task<IActionResult> CloseSession(Guid attendanceSessionId, CancellationToken cancellationToken)
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

    [HttpGet("sessions/{attendanceSessionId:guid}/qr")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> GetRotatingQrToken(Guid attendanceSessionId, CancellationToken cancellationToken)
    {
        var campusId = await GetSessionCampusIdAsync(attendanceSessionId, cancellationToken);
        if (campusId is null && !await db.AttendanceSessions.AnyAsync(x => x.Id == attendanceSessionId, cancellationToken))
            return NotFound(new { message = "Attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
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
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> MarkWithQr(Guid attendanceSessionId, MarkQrAttendanceRequest request, CancellationToken cancellationToken)
    {
        if (!IsValidQrToken(attendanceSessionId, request.Token))
            return Unauthorized(new { message = "The attendance QR code is invalid or has expired. Scan the current code and try again." });
        var campusError = await ValidateAttendanceCampusAsync(attendanceSessionId, request.StudentId, cancellationToken);
        if (campusError is not null) return campusError;

        try
        {
            var record = await service.MarkAsync(attendanceSessionId, request.StudentId, request.Status ?? "Present", request.Remarks, cancellationToken);
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

    [HttpPost("sessions/{attendanceSessionId:guid}/records")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> Mark(Guid attendanceSessionId, MarkAttendanceRequest request, CancellationToken cancellationToken)
    {
        var campusError = await ValidateAttendanceCampusAsync(attendanceSessionId, request.StudentId, cancellationToken);
        if (campusError is not null) return campusError;
        try
        {
            var record = await service.MarkAsync(attendanceSessionId, request.StudentId, request.Status, request.Remarks, cancellationToken);
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

    [HttpGet("students/search")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> SearchStudents([FromQuery] string? q, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(Array.Empty<object>());
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var term = q.Trim().ToLowerInvariant();
        var query = db.Students.AsNoTracking().Where(s => !s.IsArchived && s.Status == "Active");
        if (accessibleCampuses is not null)
            query = query.Where(s => s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value));
        var matches = await query.Where(s => s.StudentNumber.ToLower().Contains(term)
                || s.FirstName.ToLower().Contains(term) || s.LastName.ToLower().Contains(term)
                || (s.OtherNames != null && s.OtherNames.ToLower().Contains(term)))
            .OrderBy(s => s.LastName).ThenBy(s => s.FirstName).Take(25)
            .Select(s => new { s.Id, s.StudentNumber, s.LastName, s.FirstName, s.OtherNames })
            .ToListAsync(cancellationToken);
        return Ok(matches.Select(s => new { id = s.Id, registrationNumber = s.StudentNumber,
            name = string.Join(" ", new[] { s.LastName, s.FirstName, s.OtherNames }.Where(v => !string.IsNullOrWhiteSpace(v))) }));
    }

    [HttpGet("students/{studentId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> StudentHistory(Guid studentId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        if (from.HasValue && to.HasValue && to.Value < from.Value)
            return BadRequest(new { message = "The end date must be on or after the start date." });

        var fromDate = from;
        var toDate = to;
        var history = await (
            from record in db.StudentAttendances.AsNoTracking()
            join session in db.AttendanceSessions.AsNoTracking() on record.AttendanceSessionId equals session.Id
            join entry in db.TimetableEntries.AsNoTracking() on session.TimetableEntryId equals entry.Id
            join teachingGroup in db.TeachingGroups.AsNoTracking() on entry.TeachingGroupId equals teachingGroup.Id
            where record.StudentId == studentId
                && (!fromDate.HasValue || session.SessionDate >= fromDate.Value)
                && (!toDate.HasValue || session.SessionDate <= toDate.Value)
            orderby session.SessionDate descending
            select new
            {
                record.Id,
                record.AttendanceSessionId,
                record.StudentId,
                record.Status,
                record.Remarks,
                sessionDate = session.SessionDate,
                sessionStatus = session.Status,
                className = teachingGroup.Name == null || teachingGroup.Name == "" ? teachingGroup.GroupCode : teachingGroup.GroupCode + " — " + teachingGroup.Name
            }).ToListAsync(cancellationToken);
        return Ok(history);
    }

    [HttpGet("sessions/lookup")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> FindSession([FromQuery] Guid timetableEntryId, [FromQuery] DateOnly sessionDate, CancellationToken cancellationToken)
    {
        if (timetableEntryId == Guid.Empty) return BadRequest(new { message = "A timetable entry is required." });
        var campusId = await GetTimetableCampusIdAsync(timetableEntryId, cancellationToken);
        if (campusId is null && !await db.TimetableEntries.AnyAsync(x => x.Id == timetableEntryId, cancellationToken))
            return NotFound(new { message = "Timetable entry was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
        var session = await db.AttendanceSessions.AsNoTracking()
            .SingleOrDefaultAsync(x => x.TimetableEntryId == timetableEntryId && x.SessionDate == sessionDate, cancellationToken);
        return Ok(session);
    }

    [HttpGet("options")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> Options(CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var groups = await (
            from teachingGroup in db.TeachingGroups.AsNoTracking()
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join programme in db.Programmes.AsNoTracking() on offering.ProgrammeId equals programme.Id
            join semester in db.Semesters.AsNoTracking() on offering.SemesterId equals semester.Id
            join entry in db.TimetableEntries.AsNoTracking() on teachingGroup.Id equals entry.TeachingGroupId
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
            where teachingGroup.IsActive && offering.IsActive && entry.IsActive && programme.IsActive && !programme.IsReferenceOnly
                && (accessibleCampuses == null || (staff.CampusId.HasValue && accessibleCampuses.Contains(staff.CampusId.Value)))
            select new
            {
                teachingGroupId = teachingGroup.Id,
                teachingGroup.GroupCode,
                groupName = teachingGroup.Name,
                programmeId = programme.Id,
                programmeName = programme.Name,
                semesterId = semester.Id,
                semesterName = semester.Name,
                timetableEntryId = entry.Id,
                entry.DayOfWeek,
                entry.StartTime,
                entry.EndTime,
                entry.CourseId
            }).Distinct().OrderBy(x => x.programmeName).ThenBy(x => x.GroupCode).ToListAsync(cancellationToken);

        var programmes = await db.Programmes.AsNoTracking().Where(x => x.IsActive && !x.IsReferenceOnly)
            .OrderBy(x => x.Name).Select(x => new { x.Id, x.Name }).ToListAsync(cancellationToken);
        var intakes = await db.Intakes.AsNoTracking().OrderByDescending(x => x.StartDate)
            .Select(x => new { x.Id, x.Name, x.Code }).ToListAsync(cancellationToken);
        var semesters = await db.Semesters.AsNoTracking().OrderByDescending(x => x.IsCurrent).ThenByDescending(x => x.StartDate)
            .Select(x => new { x.Id, x.Name, x.AcademicYearId, x.StartDate, x.EndDate, x.IsCurrent }).ToListAsync(cancellationToken);

        return Ok(new { groups, programmes, intakes, semesters });
    }

    [HttpGet("roster")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> Roster([FromQuery] Guid teachingGroupId, [FromQuery] Guid? intakeId, CancellationToken cancellationToken)
    {
        if (teachingGroupId == Guid.Empty) return BadRequest(new { message = "A class is required." });
        var group = await (
            from teachingGroup in db.TeachingGroups.AsNoTracking()
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join entry in db.TimetableEntries.AsNoTracking() on teachingGroup.Id equals entry.TeachingGroupId
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
            where teachingGroup.Id == teachingGroupId && teachingGroup.IsActive && offering.IsActive && entry.IsActive
            select new { offering.ProgrammeId, offering.SemesterId, entry.CourseId, staff.CampusId }).FirstOrDefaultAsync(cancellationToken);
        if (group is null) return NotFound(new { message = "Class or its timetable assignment was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, group.CampusId, cancellationToken)) return Forbid();

        var admissionIds = db.Admissions.AsNoTracking().Where(a => a.ProgrammeId == group.ProgrammeId
            && (!intakeId.HasValue || a.IntakeId == intakeId.Value)).Select(a => a.Id);
        var studentsQuery = db.Students.AsNoTracking().Where(s => !s.IsArchived && s.Status == "Active"
            && s.AdmissionId.HasValue && admissionIds.Contains(s.AdmissionId.Value)
            && db.CourseRegistrations.Any(reg => reg.StudentId == s.Id && reg.SemesterId == group.SemesterId && reg.CourseId == group.CourseId && (reg.Status == "Registered" || reg.Status == "Active")));
        if (group.CampusId.HasValue) studentsQuery = studentsQuery.Where(s => s.CampusId == group.CampusId);
        var students = await studentsQuery.OrderBy(s => s.LastName).ThenBy(s => s.FirstName)
            .Select(s => new { id = s.Id, registrationNumber = s.StudentNumber, s.LastName, s.FirstName, s.OtherNames })
            .ToListAsync(cancellationToken);
        return Ok(students.Select(s => new { s.id, s.registrationNumber,
            name = string.Join(" ", new[] { s.LastName, s.FirstName, s.OtherNames }.Where(v => !string.IsNullOrWhiteSpace(v))) }));
    }

    [HttpGet("monthly-report")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> MonthlyReport([FromQuery] Guid semesterId, CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty) return BadRequest(new { message = "Select a semester to view the attendance report." });
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null) return NotFound(new { message = "Semester was not found." });

        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var sessions = await (
            from session in db.AttendanceSessions.AsNoTracking()
            join entry in db.TimetableEntries.AsNoTracking() on session.TimetableEntryId equals entry.Id
            join teachingGroup in db.TeachingGroups.AsNoTracking() on entry.TeachingGroupId equals teachingGroup.Id
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
            where offering.SemesterId == semesterId && session.SessionDate >= semester.StartDate && session.SessionDate <= semester.EndDate
                && (accessibleCampuses == null || (staff.CampusId.HasValue && accessibleCampuses.Contains(staff.CampusId.Value)))
            select new { SessionId = session.Id, session.SessionDate, TeachingGroupId = teachingGroup.Id, teachingGroup.GroupCode, teachingGroup.Name }).ToListAsync(cancellationToken);

        var sessionIds = sessions.Select(x => x.SessionId).ToArray();
        var records = await db.StudentAttendances.AsNoTracking().Where(x => sessionIds.Contains(x.AttendanceSessionId))
            .Select(x => new { x.AttendanceSessionId, x.Status }).ToListAsync(cancellationToken);
        var rows = sessions.GroupBy(x => new { x.SessionDate.Year, x.SessionDate.Month, x.TeachingGroupId, x.GroupCode, x.Name })
            .Select(g =>
            {
                var groupSessionIds = g.Select(x => x.SessionId).ToArray();
                return new
                {
                    month = $"{g.Key.Year:D4}-{g.Key.Month:D2}",
                    classId = g.Key.TeachingGroupId,
                    className = string.IsNullOrWhiteSpace(g.Key.Name) ? g.Key.GroupCode : g.Key.GroupCode + " — " + g.Key.Name,
                    totalAttendance = records.Count(r => groupSessionIds.Contains(r.AttendanceSessionId)),
                    totalPresent = records.Count(r => groupSessionIds.Contains(r.AttendanceSessionId) && (r.Status == "Present" || r.Status == "Late")),
                    totalAbsent = records.Count(r => groupSessionIds.Contains(r.AttendanceSessionId) && r.Status == "Absent"),
                    totalLate = records.Count(r => groupSessionIds.Contains(r.AttendanceSessionId) && r.Status == "Late"),
                    totalExcused = records.Count(r => groupSessionIds.Contains(r.AttendanceSessionId) && r.Status == "Excused")
                };
            }).ToList();

        var monthly = rows.GroupBy(x => new { x.month, x.classId, x.className })
            .Select(g => new { g.Key.month, g.Key.classId, g.Key.className,
                totalAttendance = g.Sum(x => x.totalAttendance), totalPresent = g.Sum(x => x.totalPresent),
                totalAbsent = g.Sum(x => x.totalAbsent), totalLate = g.Sum(x => x.totalLate), totalExcused = g.Sum(x => x.totalExcused) })
            .OrderBy(x => x.month).ThenBy(x => x.className).ToList();
        var overall = monthly.GroupBy(x => new { x.classId, x.className })
            .Select(g => new { classId = g.Key.classId, className = g.Key.className,
                totalAttendance = g.Sum(x => x.totalAttendance), totalPresent = g.Sum(x => x.totalPresent),
                totalAbsent = g.Sum(x => x.totalAbsent), totalLate = g.Sum(x => x.totalLate), totalExcused = g.Sum(x => x.totalExcused) })
            .OrderBy(x => x.className).ToList();
        return Ok(new { semester = new { semester.Id, semester.Name, semester.StartDate, semester.EndDate }, monthly, overall });
    }

    [HttpGet("sessions/{attendanceSessionId:guid}/register")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> Register(Guid attendanceSessionId, [FromQuery] Guid? intakeId, CancellationToken cancellationToken)
    {
        var session = await db.AttendanceSessions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == attendanceSessionId, cancellationToken);
        if (session is null) return NotFound(new { message = "Attendance session was not found." });
        var context = await (
            from entry in db.TimetableEntries.AsNoTracking()
            join teachingGroup in db.TeachingGroups.AsNoTracking() on entry.TeachingGroupId equals teachingGroup.Id
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
            where entry.Id == session.TimetableEntryId
            select new { teachingGroup.Id, teachingGroup.GroupCode, teachingGroup.Name, offering.ProgrammeId, offering.SemesterId, entry.CourseId, staff.CampusId }).FirstOrDefaultAsync(cancellationToken);
        if (context is null || !await campusAccess.CanAccessCampusAsync(User, context.CampusId, cancellationToken)) return Forbid();
        var admissionIds = db.Admissions.AsNoTracking().Where(a => a.ProgrammeId == context.ProgrammeId
            && (!intakeId.HasValue || a.IntakeId == intakeId.Value)).Select(a => a.Id);
        var rosterQuery = db.Students.AsNoTracking().Where(s => !s.IsArchived && s.Status == "Active"
            && s.AdmissionId.HasValue && admissionIds.Contains(s.AdmissionId.Value)
            && db.CourseRegistrations.Any(reg => reg.StudentId == s.Id && reg.SemesterId == context.SemesterId && reg.CourseId == context.CourseId && (reg.Status == "Registered" || reg.Status == "Active")));
        if (context.CampusId.HasValue) rosterQuery = rosterQuery.Where(s => s.CampusId == context.CampusId);
        var rosterRows = await rosterQuery.OrderBy(s => s.LastName).ThenBy(s => s.FirstName)
            .Select(s => new { id = s.Id, registrationNumber = s.StudentNumber, s.LastName, s.FirstName, s.OtherNames })
            .ToListAsync(cancellationToken);
        var roster = rosterRows.Select((s, index) => new { number = index + 1, s.id, s.registrationNumber,
            name = string.Join(" ", new[] { s.LastName, s.FirstName, s.OtherNames }.Where(v => !string.IsNullOrWhiteSpace(v))) }).ToList();
        var existing = await db.StudentAttendances.AsNoTracking().Where(x => x.AttendanceSessionId == attendanceSessionId)
            .Select(x => new { x.Id, x.StudentId, x.Status, x.Remarks }).ToListAsync(cancellationToken);
        var register = roster.Select((student, index) =>
        {
            var record = existing.FirstOrDefault(x => x.StudentId == student.id);
            return new { student.number, student.id, student.registrationNumber, student.name,
                status = record?.Status, remarks = record?.Remarks, attendanceRecordId = record?.Id };
        }).ToList();
        return Ok(new { session, className = string.IsNullOrWhiteSpace(context.Name) ? context.GroupCode : context.GroupCode + " — " + context.Name, students = register });
    }

    [HttpPut("records/{recordId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
    public async Task<IActionResult> UpdateRecord(Guid recordId, UpdateAttendanceRecordRequest request, CancellationToken cancellationToken)
    {
        var record = await db.StudentAttendances.SingleOrDefaultAsync(x => x.Id == recordId, cancellationToken);
        if (record is null) return NotFound(new { message = "Attendance record was not found." });
        var session = await db.AttendanceSessions.SingleOrDefaultAsync(x => x.Id == record.AttendanceSessionId, cancellationToken);
        if (session is null) return NotFound(new { message = "Attendance session was not found." });
        if (session.Status != "Open") return Conflict(new { message = "Only open attendance sessions can be corrected." });
        var campusId = await GetSessionCampusIdAsync(session.Id, cancellationToken);
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)
            || !await campusAccess.CanAccessStudentAsync(User, record.StudentId, cancellationToken)) return Forbid();
        var status = request.Status?.Trim();
        if (status is not ("Present" or "Absent" or "Late" or "Excused"))
            return BadRequest(new { message = "Status must be Present, Absent, Late or Excused." });
        record.Status = status;
        record.Remarks = request.Remarks?.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { record.Id, record.StudentId, record.Status, record.Remarks });
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

    private async Task<IActionResult?> ValidateAttendanceCampusAsync(Guid sessionId, Guid studentId, CancellationToken cancellationToken)
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

    private string CreateQrToken(Guid sessionId, long slot)
    {
        var secret = configuration["Security:AttendanceQrSecret"]
            ?? configuration["SMIS_ATTENDANCE_QR_SECRET"]
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
