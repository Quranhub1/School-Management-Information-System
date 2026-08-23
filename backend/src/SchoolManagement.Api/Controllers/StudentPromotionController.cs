using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/students/{studentId:guid}/promotions")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public sealed class StudentPromotionController(
    StudentPromotionService promotionService,
    IAcademicRecordRepository academicRecords) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Promote(
        Guid studentId,
        PromoteStudentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var sourceTranscript = await academicRecords.GetTranscriptAsync(
                studentId,
                request.FromAcademicYearId,
                request.FromSemesterId,
                cancellationToken);

            var promotion = await promotionService.PromoteAsync(
                studentId,
                request.FromAcademicYearId,
                request.FromSemesterId,
                request.ToAcademicYearId,
                request.ToSemesterId,
                sourceTranscript,
                User.Identity?.Name,
                cancellationToken);

            return Ok(promotion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

public sealed record PromoteStudentRequest(
    Guid FromAcademicYearId,
    Guid FromSemesterId,
    Guid ToAcademicYearId,
    Guid ToSemesterId);
