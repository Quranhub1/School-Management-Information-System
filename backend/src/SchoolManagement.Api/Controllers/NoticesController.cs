using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Communication;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/notices")]
[Authorize(Policy = AuthorizationPolicies.CommunicationManagement)]
public sealed class NoticesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("board")]
    [Authorize(Policy = AuthorizationPolicies.CommunicationRead)]
    public async Task<ActionResult<IReadOnlyList<Notice>>> GetBoard(CancellationToken ct)
        => Ok(await db.Notices.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.CreatedAt).ToListAsync(ct));

    [HttpPost("board")]
    [Authorize(Policy = AuthorizationPolicies.CommunicationManagement)]
    public async Task<ActionResult<Notice>> Create([FromBody] CreateNoticeRequest request, CancellationToken ct)
    {
        var notice = new Notice
        {
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            Priority = request.Priority.Trim(),
            Audience = request.Audience.Trim(),
            ExpiresAt = request.ExpiresAt,
            CreatedBy = request.CreatedBy.Trim()
        };
        db.Notices.Add(notice);
        await db.SaveChangesAsync(ct);
        return Created($"api/notices/{notice.Id}", notice);
    }
}

public sealed record CreateNoticeRequest(string Title, string Body, string Priority, string Audience, DateTimeOffset? ExpiresAt, string CreatedBy);
