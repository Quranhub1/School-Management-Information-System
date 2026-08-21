using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-records")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicRecordsController(AcademicRecordService service) : ControllerBase
{
    [HttpGet("students/{studentId:guid}/transcript")]
    public async Task<ActionResult<IReadOnlyList<TranscriptEntry>>> GetTranscript(
        Guid studentId,
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? semesterId,
        CancellationToken cancellationToken)
    {
        var entries = await service.GetTranscriptAsync(
            studentId,
            academicYearId,
            semesterId,
            cancellationToken);

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
}
