using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Api.Services;
using SchoolManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/examinations/results")]
[Authorize(Policy = AuthorizationPolicies.ExaminationManagement)]
public sealed class ExaminationResultsController(AcademicRecordService service, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet("students/{studentId:guid}/transcript")]
    public async Task<ActionResult<IReadOnlyList<TranscriptEntry>>> GetTranscript(
        Guid studentId,
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? semesterId,
        CancellationToken cancellationToken)
    {
        if (!await db.Students.AnyAsync(x => x.Id == studentId, cancellationToken)) return NotFound();
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        var entries = await service.GetTranscriptAsync(studentId, academicYearId, semesterId, cancellationToken);
        return Ok(entries);
    }

    [HttpGet("students/{studentId:guid}/summaries")]
    public async Task<ActionResult<IReadOnlyList<AcademicResultSummary>>> GetSummaries(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        if (!await db.Students.AnyAsync(x => x.Id == studentId, cancellationToken)) return NotFound();
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        var summaries = await service.GetSummariesAsync(studentId, cancellationToken);
        return Ok(summaries);
    }
}
