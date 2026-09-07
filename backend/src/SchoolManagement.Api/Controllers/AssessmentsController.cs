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

    [HttpGet("records/{id:guid}")]
    public async Task<ActionResult<StudentAssessment>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var assessments = await service.GetStudentAssessmentsAsync(Guid.Empty, cancellationToken);
        var assessment = assessments.SingleOrDefault(x => x.Id == id);
        return assessment is null ? NotFound() : Ok(assessment);
    }

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
        return Created($"/api/assessments/records/{assessment.Id}", assessment);
    }

    public sealed record RecordAssessmentRequest(
        Guid StudentId,
        Guid CourseRegistrationId,
        Guid AssessmentPlanId,
        decimal Score,
        decimal MaximumScore,
        string? CompetencyLevel);
}
