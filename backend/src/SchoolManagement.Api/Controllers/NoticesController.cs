using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Communication;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/notices")]
[Authorize(Policy = AuthorizationPolicies.CommunicationRead)]
public sealed class NoticesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("board")]
    [Authorize(Policy = AuthorizationPolicies.CommunicationRead)]
    public async Task<ActionResult<IReadOnlyList<Notice>>> GetBoard(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var roles = User.Claims
            .Where(claim => claim.Type == ClaimTypes.Role || claim.Type == "role" || claim.Type == "roles")
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var departments = User.Claims
            .Where(claim => claim.Type.Equals("department", StringComparison.OrdinalIgnoreCase)
                || claim.Type.Equals("departmentName", StringComparison.OrdinalIgnoreCase))
            .Select(claim => claim.Value.Trim())
            .Where(value => value.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var activeNotices = await db.Notices.AsNoTracking()
            .Where(notice => notice.IsActive && (notice.ExpiresAt == null || notice.ExpiresAt > now))
            .OrderByDescending(notice => notice.CreatedAt)
            .ToListAsync(ct);

        var visible = activeNotices.Where(notice =>
        {
            var audience = notice.Audience.Trim();
            if (audience.Equals("All", StringComparison.OrdinalIgnoreCase))
                return true;

            var separator = audience.IndexOf(':');
            if (separator < 0) return false;

            var audienceType = audience[..separator].Trim();
            var audienceValue = audience[(separator + 1)..].Trim();
            if (audienceType.Equals("Role", StringComparison.OrdinalIgnoreCase))
                return roles.Contains(audienceValue);
            if (audienceType.Equals("Department", StringComparison.OrdinalIgnoreCase))
                return departments.Contains(audienceValue);
            return false;
        }).ToArray();

        return Ok(visible);
    }

    [HttpPost("board")]
    [Authorize(Policy = AuthorizationPolicies.CommunicationManagement)]
    public async Task<ActionResult<Notice>> Create([FromBody] CreateNoticeRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
            return BadRequest("A notice title and message are required.");

        var audience = request.Audience.Trim();
        if (!audience.Equals("All", StringComparison.OrdinalIgnoreCase)
            && !(audience.StartsWith("Role:", StringComparison.OrdinalIgnoreCase)
                || audience.StartsWith("Department:", StringComparison.OrdinalIgnoreCase)))
            return BadRequest("Choose All, a role, or a department as the notice audience.");

        if (audience.StartsWith("Role:", StringComparison.OrdinalIgnoreCase)
            && audience["Role:".Length..].Trim().Equals(InstitutionalRoles.Student, StringComparison.OrdinalIgnoreCase))
            return BadRequest("Student notices are not supported in the administrative SMIS.");

        var createdBy = User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? "SMIS user";

        var notice = new Notice
        {
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            Priority = string.IsNullOrWhiteSpace(request.Priority) ? "General" : request.Priority.Trim(),
            Audience = audience,
            ExpiresAt = request.ExpiresAt,
            CreatedBy = createdBy
        };
        db.Notices.Add(notice);
        await db.SaveChangesAsync(ct);
        return Created($"api/notices/{notice.Id}", notice);
    }
}

public sealed record CreateNoticeRequest(string Title, string Body, string Priority, string Audience, DateTimeOffset? ExpiresAt);
