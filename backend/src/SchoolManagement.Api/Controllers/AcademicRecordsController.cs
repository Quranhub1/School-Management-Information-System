using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-records")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicRecordsController(AcademicRecordService service, ProgressionAssessment progression) : ControllerBase
{
    [HttpGet("students/{studentId:guid}/transcript")]
    public async Task<ActionResult<IReadOnlyList<TranscriptEntry>>> GetTranscript(
        Guid studentId,
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? semesterId,
        CancellationToken cancellationToken)
    {
        var entries = await service.GetTranscriptAsync(studentId, academicYearId, semesterId, cancellationToken);
        return Ok(entries);
    }

    [HttpGet("students/{studentId:guid}/summaries")]
    public async Task<ActionResult<IReadOnlyList<AcademicResultSummary>>> GetSummaries(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var summaries = await service.GetSummariesAsync(studentId, cancellationToken);
        return Ok(summaries);
    }

    [HttpGet("students/{studentId:guid}/outstanding/missed-papers")]
    public async Task<ActionResult<IReadOnlyList<TranscriptEntry>>> GetOutstandingMissedPapers(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var entries = await service.GetOutstandingMissedPapersAsync(studentId, cancellationToken);
        return Ok(entries);
    }

    [HttpGet("students/{studentId:guid}/progression-assessment")]
    public async Task<ActionResult<ProgressionDecision>> GetProgressionAssessment(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        var summaries = await service.GetSummariesAsync(studentId, cancellationToken);
        var summary = summaries.OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId).FirstOrDefault();
        if (summary is null)
            return NotFound();

        var transcript = await service.GetTranscriptAsync(studentId, null, null, cancellationToken);
        return Ok(progression.Evaluate(summary, transcript));
    }
}
