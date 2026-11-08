using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Api.Services;
using SchoolManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/course-registrations")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CourseRegistrationsController(CourseRegistrationService service, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetByStudent(Guid studentId, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        return Ok(await service.GetByStudentAsync(studentId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Register(RegisterCourseRequest request, CancellationToken cancellationToken)
    {
        if (request.StudentId == Guid.Empty || request.CourseId == Guid.Empty || request.SemesterId == Guid.Empty)
            return BadRequest(new { message = "Student, course, and semester are required." });

        if (!await campusAccess.CanAccessStudentAsync(User, request.StudentId, cancellationToken)) return Forbid();
        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.StudentId, cancellationToken);
        if (student is null) return NotFound(new { message = "Student was not found." });
        if (await db.Campuses.AnyAsync(x => x.IsActive, cancellationToken) && !student.CampusId.HasValue)
            return Conflict(new { message = "Assign the student to a campus before registering courses." });

        // An admitted student may only register for courses mapped into the curriculum
        // of the programme recorded on their admission.
        if (student.AdmissionId.HasValue)
        {
            var admission = await db.Admissions.AsNoTracking()
                .SingleOrDefaultAsync(x => x.Id == student.AdmissionId.Value, cancellationToken);
            if (admission is null)
                return Conflict(new { message = "The student's admission record is missing; correct the admission link before course registration." });

            var courseInProgramme = await (
                from mapping in db.CurriculumCourses.AsNoTracking()
                join curriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals curriculum.Id
                where curriculum.ProgrammeId == admission.ProgrammeId
                    && curriculum.IsActive
                    && mapping.CourseId == request.CourseId
                select mapping.Id)
                .AnyAsync(cancellationToken);

            if (!courseInProgramme)
                return Conflict(new
                {
                    message = "This course is not part of the student's admitted programme curriculum. Select a mapped course or update the programme curriculum first."
                });
        }

        try
        {
            var registration = await service.RegisterAsync(request.StudentId, request.CourseId, request.SemesterId, cancellationToken, student.CampusId);
            return Ok(registration);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    public sealed record RegisterCourseRequest(Guid StudentId, Guid CourseId, Guid SemesterId);
}
