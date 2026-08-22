using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/assessments")]
[Authorize(Policy = AuthorizationPolicies.ExaminationManagement)]
public sealed class AssessmentsController(AssessmentService service) : ControllerBase
{
    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<AssessmentPlan>>> GetPlans(
        [FromQuery] Guid? courseId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetPlansAsync(courseId, cancellationToken));

    [HttpGet("registrations/{courseRegistrationId:guid}")]
    public async Task<ActionResult<IReadOnlyList<StudentAssessment>>> GetStudentAssessments(
        Guid courseRegistrationId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetStudentAssessmentsAsync(courseRegistrationId, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<StudentAssessment>> Record(
        [FromBody] RecordAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        var assessment = await service.RecordAssessmentAsync(
            request.StudentId,
            request.CourseRegistrationId,
            request.AssessmentPlanId,
            request.Score,
            request.MaximumScore,
            request.CompetencyLevel,
            cancellationToken);
        return Created($"/api/assessments/registrations/{assessment.CourseRegistrationId}", assessment);
    }

    public sealed record RecordAssessmentRequest(
        Guid StudentId,
        Guid CourseRegistrationId,
        Guid AssessmentPlanId,
        decimal Score,
        decimal MaximumScore,
        string? CompetencyLevel);
}
