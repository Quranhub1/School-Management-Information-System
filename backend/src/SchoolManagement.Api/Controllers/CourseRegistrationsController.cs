using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/course-registrations")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CourseRegistrationsController(CourseRegistrationService service) : ControllerBase
{
    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetByStudent(Guid studentId, CancellationToken cancellationToken)
        => Ok(await service.GetByStudentAsync(studentId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Register(RegisterCourseRequest request, CancellationToken cancellationToken)
    {
        if (request.StudentId == Guid.Empty || request.CourseId == Guid.Empty || request.SemesterId == Guid.Empty)
            return BadRequest(new { message = "Student, course, and semester are required." });

        try
        {
            var registration = await service.RegisterAsync(request.StudentId, request.CourseId, request.SemesterId, cancellationToken);
            return Ok(registration);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    public sealed record RegisterCourseRequest(Guid StudentId, Guid CourseId, Guid SemesterId);
}
