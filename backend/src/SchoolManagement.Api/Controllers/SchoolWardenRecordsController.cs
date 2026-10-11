using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Hostel;
using SchoolManagement.Infrastructure.Persistence;
using System.Security.Claims;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/warden/records")]
[Authorize(Policy = AuthorizationPolicies.HostelManagement)]
public sealed class SchoolWardenRecordsController(SchoolManagementDbContext db) : ControllerBase
{
    private static readonly HashSet<string> Categories = new(StringComparer.Ordinal)
        { "CheckIn", "CheckOut", "Inspection", "Maintenance", "Indiscipline" };
    private static readonly HashSet<string> Statuses = new(StringComparer.Ordinal)
        { "Open", "InProgress", "Resolved", "Closed" };

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? category, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = db.WardenRecords.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(category))
        {
            if (!Categories.Contains(category)) return BadRequest(new { message = "Unknown Warden record category." });
            query = query.Where(x => x.Category == category);
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Statuses.Contains(status)) return BadRequest(new { message = "Unknown Warden record status." });
            query = query.Where(x => x.Status == status);
        }
        var records = await query.OrderByDescending(x => x.RecordedAtUtc).Take(500).ToListAsync(cancellationToken);
        return Ok(records);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateWardenRecordRequest request, CancellationToken cancellationToken)
    {
        if (!Categories.Contains(request.Category)) return BadRequest(new { message = "Choose a valid record category." });
        if (string.IsNullOrWhiteSpace(request.Subject)) return BadRequest(new { message = "A subject is required." });
        if (string.IsNullOrWhiteSpace(request.Details)) return BadRequest(new { message = "Details are required." });
        var record = new WardenRecord
        {
            Category = request.Category,
            Subject = request.Subject.Trim(),
            StudentName = string.IsNullOrWhiteSpace(request.StudentName) ? null : request.StudentName.Trim(),
            StudentReference = string.IsNullOrWhiteSpace(request.StudentReference) ? null : request.StudentReference.Trim(),
            Details = request.Details.Trim(),
            Status = "Open",
            RecordedBy = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? "unknown"
        };
        db.WardenRecords.Add(record);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/warden/records/{record.Id}", record);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWardenRecordRequest request, CancellationToken cancellationToken)
    {
        var record = await db.WardenRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (record is null) return NotFound(new { message = "Warden record not found." });
        if (!Statuses.Contains(request.Status)) return BadRequest(new { message = "Choose a valid record status." });
        record.Status = request.Status;
        record.ActionTaken = string.IsNullOrWhiteSpace(request.ActionTaken) ? null : request.ActionTaken.Trim();
        record.ClosedAtUtc = request.Status is "Resolved" or "Closed" ? DateTimeOffset.UtcNow : null;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(record);
    }
}

public sealed record CreateWardenRecordRequest(
    string Category,
    string Subject,
    string Details,
    string? StudentName,
    string? StudentReference);

public sealed record UpdateWardenRecordRequest(string Status, string? ActionTaken);
