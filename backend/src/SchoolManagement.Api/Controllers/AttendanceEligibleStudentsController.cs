using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/attendance/sessions")]
[Authorize]
public sealed class AttendanceEligibleStudentsController(
    SchoolManagementDbContext db,
    CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet("{sessionId:guid}/eligible-students")]
    [Authorize(Policy = AuthorizationPolicies.AttendanceRead)]
    public async Task<IActionResult> EligibleStudents(
        Guid sessionId,
        [FromQuery] string? search,
        [FromQuery] Guid? intakeId,
        CancellationToken cancellationToken)
    {
        var session = await db.AttendanceSessions.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == sessionId, cancellationToken);
        if (session is null)
            return NotFound(new { message = "Attendance session was not found." });

        var context = await (
            from entry in db.TimetableEntries.AsNoTracking()
            join teachingGroup in db.TeachingGroups.AsNoTracking() on entry.TeachingGroupId equals teachingGroup.Id
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join programme in db.Programmes.AsNoTracking() on offering.ProgrammeId equals programme.Id
            join semester in db.Semesters.AsNoTracking() on offering.SemesterId equals semester.Id
            join academicYear in db.AcademicYears.AsNoTracking() on semester.AcademicYearId equals academicYear.Id
            join course in db.Courses.AsNoTracking() on entry.CourseId equals course.Id
            join staff in db.StaffMembers.AsNoTracking() on entry.StaffMemberId equals staff.Id
            where entry.Id == session.TimetableEntryId
            select new
            {
                teachingGroup.GroupCode,
                teachingGroup.Name,
                ProgrammeName = programme.Name,
                SemesterName = semester.Name,
                AcademicYearName = academicYear.Name,
                CourseName = course.Name,
                CourseCode = course.Code,
                entry.Room,
                entry.DayOfWeek,
                entry.StartTime,
                entry.EndTime,
                staff.CampusId,
                offering.ProgrammeId,
                offering.SemesterId,
                entry.CourseId
            }).FirstOrDefaultAsync(cancellationToken);

        if (context is null)
            return NotFound(new { message = "The timetable context for this attendance session was not found." });
        if (!await campusAccess.CanAccessCampusAsync(User, context.CampusId, cancellationToken))
            return Forbid();

        var admissionIds = db.Admissions.AsNoTracking()
            .Where(a => a.ProgrammeId == context.ProgrammeId
                && (!intakeId.HasValue || a.IntakeId == intakeId.Value))
            .Select(a => a.Id);

        var studentsQuery = db.Students.AsNoTracking().Where(s =>
            !s.IsArchived && s.Status == "Active"
            && s.AdmissionId.HasValue && admissionIds.Contains(s.AdmissionId.Value)
            && db.CourseRegistrations.Any(reg =>
                reg.StudentId == s.Id
                && reg.SemesterId == context.SemesterId
                && reg.CourseId == context.CourseId
                && (reg.Status == "Registered" || reg.Status == "Active")));

        if (context.CampusId.HasValue)
            studentsQuery = studentsQuery.Where(s => s.CampusId == context.CampusId);

        var totalEnrolled = await studentsQuery.CountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            if (term.Length < 2)
                return BadRequest(new { message = "Enter at least two characters to search the class register." });

            studentsQuery = studentsQuery.Where(s =>
                s.StudentNumber.ToLower().Contains(term)
                || s.FirstName.ToLower().Contains(term)
                || s.LastName.ToLower().Contains(term)
                || (s.OtherNames != null && s.OtherNames.ToLower().Contains(term)));
        }

        var roster = await studentsQuery
            .OrderBy(s => s.LastName).ThenBy(s => s.FirstName)
            .Select(s => new
            {
                s.Id,
                studentNumber = s.StudentNumber,
                s.LastName,
                s.FirstName,
                s.OtherNames
            })
            .ToListAsync(cancellationToken);

        var existing = await db.StudentAttendances.AsNoTracking()
            .Where(x => x.AttendanceSessionId == sessionId)
            .Select(x => new { x.Id, x.StudentId, x.Status, x.Remarks })
            .ToListAsync(cancellationToken);
        var summary = new
        {
            present = existing.Count(x => x.Status == "Present"),
            absent = existing.Count(x => x.Status == "Absent"),
            late = existing.Count(x => x.Status == "Late"),
            excused = existing.Count(x => x.Status == "Excused"),
            marked = existing.Count,
            unmarked = Math.Max(0, totalEnrolled - existing.Count)
        };

        var students = roster.Select((student, index) =>
        {
            var record = existing.FirstOrDefault(x => x.StudentId == student.Id);
            return new
            {
                number = index + 1,
                id = student.Id,
                registrationNumber = student.studentNumber,
                name = string.Join(" ", new[] { student.LastName, student.FirstName, student.OtherNames }
                    .Where(value => !string.IsNullOrWhiteSpace(value))),
                status = record?.Status,
                remarks = record?.Remarks,
                attendanceRecordId = record?.Id
            };
        }).ToList();

        return Ok(new
        {
            session,
            summary,
            context = new
            {
                className = string.IsNullOrWhiteSpace(context.Name)
                    ? context.GroupCode
                    : context.GroupCode + " — " + context.Name,
                context.ProgrammeName,
                context.SemesterName,
                context.AcademicYearName,
                context.CourseName,
                context.CourseCode,
                context.Room,
                dayOfWeek = context.DayOfWeek.ToString(),
                context.StartTime,
                context.EndTime,
                totalEnrolled
            },
            students
        });
    }
}
