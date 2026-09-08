using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/parent-portal")]
[Authorize(Policy = AuthorizationPolicies.ParentPortal)]
public sealed class ParentPortalController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<IReadOnlyList<ParentPortalChild>>> GetChildren(CancellationToken ct)
    {
        var identity = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(identity)) return Unauthorized();

        var guardians = await db.StudentGuardians.AsNoTracking()
            .Where(g => g.Email != null && g.Email.ToLower() == identity.ToLower())
            .ToListAsync(ct);
        if (guardians.Count == 0) return NotFound(new { message = "No student is linked to this parent account." });

        var studentIds = guardians.Select(g => g.StudentId).Distinct().ToArray();
        var students = await db.Students.AsNoTracking().Where(s => studentIds.Contains(s.Id)).ToListAsync(ct);
        var summaries = await db.AcademicResultSummaries.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId))
            .OrderByDescending(x => x.AcademicYearId).ThenByDescending(x => x.SemesterId)
            .ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId))
            .ToListAsync(ct);

        var result = students.Select(student =>
        {
            var guardian = guardians.FirstOrDefault(g => g.StudentId == student.Id);
            var latest = summaries.FirstOrDefault(x => x.StudentId == student.Id);
            var balance = invoices.Where(x => x.StudentId == student.Id).Sum(x => x.OutstandingAmount);
            return new ParentPortalChild(
                student.Id,
                student.StudentNumber,
                $"{student.FirstName} {student.LastName}".Trim(),
                student.Status,
                guardian?.Relationship,
                latest?.Gpa,
                latest?.Cgpa,
                balance,
                invoices.Where(x => x.StudentId == student.Id).Count(x => x.OutstandingAmount > 0));
        }).ToList();

        return Ok(result);
    }
}

public sealed record ParentPortalChild(
    Guid StudentId,
    string StudentNumber,
    string FullName,
    string Status,
    string? Relationship,
    decimal? LatestGpa,
    decimal? Cgpa,
    decimal OutstandingBalance,
    int OutstandingInvoices);
