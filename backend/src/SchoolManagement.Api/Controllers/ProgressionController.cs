using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Progression;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/progression")]
[Authorize]
public sealed class ProgressionController : ControllerBase
{
    private readonly ProgressionWorkflowService _workflow;

    public ProgressionController(ProgressionWorkflowService workflow) => _workflow = workflow;

    [HttpPost("decisions")]
    public async Task<ActionResult<ProgressionDecisionDto>> Decide(
        [FromBody] CreateProgressionDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var decision = await _workflow.DecideAndRecordAsync(
            request.StudentId,
            request.FromSemesterId,
            request.ToSemesterId,
            request.PassRate,
            new ProgressionRule(request.MinimumPassRate, request.AllowConditional),
            request.Reason,
            cancellationToken);

        return Ok(new ProgressionDecisionDto(
            decision.StudentId,
            decision.FromSemesterId,
            decision.ToSemesterId,
            decision.Outcome,
            decision.PassRate,
            decision.Reason));
    }
}

public sealed record CreateProgressionDecisionRequest(
    Guid StudentId,
    Guid FromSemesterId,
    Guid? ToSemesterId,
    decimal PassRate,
    decimal MinimumPassRate,
    bool AllowConditional,
    string? Reason);
