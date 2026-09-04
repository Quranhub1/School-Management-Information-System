using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Analytics;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Policy = AuthorizationPolicies.ReportingManagement)]
public sealed class AnalyticsController(
    ExaminationAnalyticsService examinationAnalytics,
    TeacherWorkloadService teacherWorkload,
    AdministrationAssistantService assistant) : ControllerBase
{
    [HttpGet("examination/courses")]
    public async Task<ActionResult<IReadOnlyList<CourseAnalytics>>> GetCourseAnalytics(
        [FromQuery] Guid semesterId,
        CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty)
            return BadRequest(new { message = "semesterId is required." });

        return Ok(await examinationAnalytics.GetCourseAnalyticsAsync(semesterId, cancellationToken));
    }

    [HttpGet("examination/semesters")]
    public async Task<ActionResult<SemesterAnalytics>> GetSemesterAnalytics(
        [FromQuery] Guid semesterId,
        CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty)
            return BadRequest(new { message = "semesterId is required." });

        return Ok(await examinationAnalytics.GetSemesterAnalyticsAsync(semesterId, cancellationToken));
    }

    [HttpGet("examination/at-risk")]
    public async Task<ActionResult<IReadOnlyList<StudentRiskAnalytics>>> GetAtRiskStudents(
        [FromQuery] Guid semesterId,
        CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty)
            return BadRequest(new { message = "semesterId is required." });

        return Ok(await examinationAnalytics.GetAtRiskStudentsAsync(semesterId, cancellationToken));
    }

    [HttpGet("teacher-workload")]
    public async Task<ActionResult<IReadOnlyList<TeacherWorkload>>> GetTeacherWorkload(
        [FromQuery] Guid semesterId,
        CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty)
            return BadRequest(new { message = "semesterId is required." });

        return Ok(await teacherWorkload.GetTeacherWorkloadAsync(semesterId, cancellationToken));
    }

    [HttpGet("teacher-workload/departments")]
    public async Task<ActionResult<IReadOnlyList<DepartmentWorkloadSummary>>> GetDepartmentWorkloadSummary(
        [FromQuery] Guid semesterId,
        CancellationToken cancellationToken)
    {
        if (semesterId == Guid.Empty)
            return BadRequest(new { message = "semesterId is required." });

        return Ok(await teacherWorkload.GetDepartmentWorkloadSummaryAsync(semesterId, cancellationToken));
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStats>> GetDashboardStats(CancellationToken cancellationToken)
    {
        return Ok(await assistant.GetDashboardStatsAsync(cancellationToken));
    }

    [HttpPost("assistant")]
    public async Task<ActionResult<string>> AnswerQuestion(
        [FromBody] AnswerQuestionRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { message = "Question is required." });

        var answer = await assistant.AnswerQuestionAsync(request.Question.Trim(), cancellationToken);
        return Ok(new { question = request.Question, answer });
    }

    public sealed record AnswerQuestionRequest(string Question);
}
