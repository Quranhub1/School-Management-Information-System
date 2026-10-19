using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/assessments")]
[Authorize(Policy = AuthorizationPolicies.ExaminationManagement)]
public sealed class AssessmentsController(AssessmentService service, SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<AssessmentPlan>>> GetPlans(
        [FromQuery] Guid? courseId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetPlansAsync(courseId, cancellationToken));

    [HttpPost("plans")]
    public async Task<ActionResult<AssessmentPlan>> CreatePlan(
        [FromBody] CreateAssessmentPlanRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name?.Trim();
        var assessmentType = request.AssessmentType?.Trim();
        if (request.CourseId == Guid.Empty)
            return BadRequest(new { message = "A valid course ID is required." });
        if (string.IsNullOrWhiteSpace(name) || name.Length > 160)
            return BadRequest(new { message = "Plan name is required and must not exceed 160 characters." });
        if (string.IsNullOrWhiteSpace(assessmentType) || assessmentType.Length > 80)
            return BadRequest(new { message = "Assessment type is required and must not exceed 80 characters." });
        if (request.WeightPercentage < 0m || request.WeightPercentage > 100m)
            return BadRequest(new { message = "Assessment weight must be between 0 and 100 percent." });
        if (!await db.Courses.AnyAsync(x => x.Id == request.CourseId, cancellationToken))
            return NotFound(new { message = "The selected course does not exist." });
        if (await db.AssessmentPlans.AnyAsync(x => x.CourseId == request.CourseId && x.Name.ToLower() == name.ToLower(), cancellationToken))
            return Conflict(new { message = "An assessment plan with this name already exists for the selected course." });

        var plan = new AssessmentPlan
        {
            CourseId = request.CourseId,
            Name = name,
            AssessmentType = assessmentType,
            WeightPercentage = request.WeightPercentage,
            IsCompetencyBased = request.IsCompetencyBased,
            IsActive = true
        };
        db.AssessmentPlans.Add(plan);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/assessments/plans?courseId={plan.CourseId}", plan);
    }

    [HttpGet("registrations/{courseRegistrationId:guid}")]
    public async Task<ActionResult<IReadOnlyList<StudentAssessment>>> GetStudentAssessments(
        Guid courseRegistrationId,
        CancellationToken cancellationToken) =>
        Ok(await service.GetStudentAssessmentsAsync(courseRegistrationId, cancellationToken));

    [HttpGet("records/{id:guid}")]
    public async Task<ActionResult<StudentAssessment>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var assessment = await service.GetStudentAssessmentByIdAsync(id, cancellationToken);
        return assessment is null ? NotFound() : Ok(assessment);
    }

    [HttpPatch("records/{id:guid}/finalize")]
    public async Task<ActionResult<StudentAssessment>> Finalize(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var assessment = await service.FinalizeStudentAssessmentAsync(id, cancellationToken);
            return assessment is null ? NotFound(new { message = "Assessment record was not found." }) : Ok(assessment);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<StudentAssessment>> Record(
        [FromBody] RecordAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        if (request.StudentId == Guid.Empty || request.CourseRegistrationId == Guid.Empty || request.AssessmentPlanId == Guid.Empty)
            return BadRequest(new { message = "Student, course registration and assessment plan are required." });

        var registration = await db.CourseRegistrations.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.CourseRegistrationId, cancellationToken);
        if (registration is null)
            return NotFound(new { message = "The course registration does not exist." });
        if (registration.StudentId != request.StudentId)
            return BadRequest(new { message = "The selected student does not match the course registration." });

        var plan = await db.AssessmentPlans.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.AssessmentPlanId && x.IsActive, cancellationToken);
        if (plan is null)
            return NotFound(new { message = "The selected assessment plan does not exist or is inactive." });
        if (plan.CourseId != registration.CourseId)
            return BadRequest(new { message = "The assessment plan belongs to a different course than this registration." });

        var alreadyRecorded = await db.StudentAssessments.AnyAsync(
            x => x.StudentId == request.StudentId
                && x.CourseRegistrationId == request.CourseRegistrationId
                && x.AssessmentPlanId == request.AssessmentPlanId,
            cancellationToken);
        if (alreadyRecorded)
            return Conflict(new { message = "A mark has already been recorded for this student, registration and assessment plan." });

        try
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
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public sealed record CreateAssessmentPlanRequest(Guid CourseId, string? Name, string? AssessmentType, decimal WeightPercentage, bool IsCompetencyBased);

    public sealed record RecordAssessmentRequest(
        Guid StudentId,
        Guid CourseRegistrationId,
        Guid AssessmentPlanId,
        decimal Score,
        decimal MaximumScore,
        string? CompetencyLevel);
}
