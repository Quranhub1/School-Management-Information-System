using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Progression;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/progression")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class ProgressionController : ControllerBase
{
    private readonly ProgressionWorkflowService _workflow;
    public ProgressionController(ProgressionWorkflowService workflow) => _workflow = workflow;

    [HttpPost("decisions")]
    public async Task<ActionResult<ProgressionDecisionDto>> Decide(
        [FromBody] CreateProgressionDecisionRequest request, CancellationToken cancellationToken)
    {
        var decision = await _workflow.DecideAndRecordAsync(
            request.StudentId, request.FromAcademicYearId, request.FromSemesterId,
            request.ToAcademicYearId, request.ToSemesterId, request.PassRate,
            request.OutstandingPaperCount,
            new ProgressionRule(request.MinimumPassRate, request.AllowConditional),
            request.Reason, User.Identity?.Name, cancellationToken);

        return Ok(new ProgressionDecisionDto(decision.StudentId, decision.FromSemesterId,
            decision.ToSemesterId, decision.Status, decision.OutstandingPaperCount, decision.Reason));
    }
}

public sealed record CreateProgressionDecisionRequest(
    Guid StudentId,
    Guid FromAcademicYearId,
    Guid FromSemesterId,
    Guid ToAcademicYearId,
    Guid ToSemesterId,
    decimal PassRate,
    decimal MinimumPassRate,
    bool AllowConditional,
    int OutstandingPaperCount,
    string? Reason);
