using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class AuditLogController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? userId, [FromQuery] string? action, [FromQuery] string? entityType, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken cancellationToken)
    {
        var query = db.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(userId)) query = query.Where(x => x.UserId == userId.Trim());
        if (!string.IsNullOrWhiteSpace(action)) query = query.Where(x => x.Action == action.Trim());
        if (!string.IsNullOrWhiteSpace(entityType)) query = query.Where(x => x.EntityType == entityType.Trim());
        if (from.HasValue) query = query.Where(x => x.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(x => x.Timestamp <= to.Value);
        return Ok(await query.OrderByDescending(x => x.Timestamp).ToListAsync(cancellationToken));
    }

    [HttpGet("finance-events")]
    public async Task<IActionResult> SearchFinanceEvents([FromQuery] string? action, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken cancellationToken)
    {
        var query = db.FinanceAuditEvents.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(action)) query = query.Where(x => x.Action == action.Trim());
        if (from.HasValue) query = query.Where(x => x.OccurredAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.OccurredAt <= to.Value);

        var events = await query.OrderByDescending(x => x.OccurredAt)
            .Select(x => new
            {
                x.Id,
                x.OccurredAt,
                x.Action,
                x.EntityType,
                x.EntityId,
                x.PerformedBy,
                x.Reason,
                x.SourceJournalEntryId,
                x.Metadata
            })
            .ToListAsync(cancellationToken);

        return Ok(events);
    }

    [HttpGet("workflow-history")]
    public async Task<IActionResult> SearchWorkflowHistory([FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken cancellationToken)
    {
        var query =
            from history in db.WorkflowHistories.AsNoTracking()
            join workflow in db.WorkflowInstances.AsNoTracking() on history.WorkflowInstanceId equals workflow.Id
            select new
            {
                history.Id,
                history.WorkflowInstanceId,
                workflow.WorkflowType,
                workflow.EntityType,
                workflow.EntityId,
                history.FromState,
                history.ToState,
                history.PerformedByUserId,
                history.Comments,
                history.PerformedAt
            };
        if (from.HasValue) query = query.Where(x => x.PerformedAt >= from.Value);
        if (to.HasValue) query = query.Where(x => x.PerformedAt <= to.Value);
        return Ok(await query.OrderByDescending(x => x.PerformedAt).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var auditLog = await db.AuditLogs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return auditLog is null ? NotFound() : Ok(auditLog);
    }
}
