using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/assessments")]
[Authorize(Policy = AuthorizationPolicies.ExaminationManagement)]
public sealed class AssessmentController(AssessmentService service) : ControllerBase
{
    [HttpGet("plans")]
    public async Task<IActionResult> Plans([FromQuery] Guid? courseId, CancellationToken cancellationToken) =>
        Ok(await service.GetPlansAsync(courseId, cancellationToken));

    [HttpGet("registrations/{courseRegistrationId:guid}")]
    public async Task<IActionResult> StudentAssessments(Guid courseRegistrationId, CancellationToken cancellationToken) =>
        Ok(await service.GetStudentAssessmentsAsync(courseRegistrationId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Record(RecordAssessmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.RecordAssessmentAsync(request.StudentId, request.CourseRegistrationId,
                request.AssessmentPlanId, request.Score, request.MaximumScore, request.CompetencyLevel, cancellationToken);
            return Created($"/api/assessments/{result.Id}", result);
        }
        catch (ArgumentOutOfRangeException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}

public sealed record RecordAssessmentRequest(
    Guid StudentId,
    Guid CourseRegistrationId,
    Guid AssessmentPlanId,
    decimal Score,
    decimal MaximumScore,
    string? CompetencyLevel);
