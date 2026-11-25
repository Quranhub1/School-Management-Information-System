using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/gate")]
[Authorize(Policy = AuthorizationPolicies.AttendanceManagement)]
public sealed class GateLogController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string? personName, [FromQuery] string? personType, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken cancellationToken)
    {
        var query = db.GateLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(personName)) query = query.Where(x => x.PersonName.Contains(personName.Trim()));
        if (!string.IsNullOrWhiteSpace(personType)) query = query.Where(x => x.PersonType == personType.Trim());
        if (from.HasValue) query = query.Where(x => x.EntryTime >= from.Value);
        if (to.HasValue) query = query.Where(x => x.EntryTime <= to.Value);
        return Ok((await query.OrderByDescending(x => x.EntryTime).ToListAsync(cancellationToken)).Select(GateLogResponseDto.FromDomain).ToArray());
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var gateLog = await db.GateLogs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return gateLog is null ? NotFound() : Ok(GateLogResponseDto.FromDomain(gateLog));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGateLogRequest request, CancellationToken cancellationToken)
    {
        var gateLog = new Domain.Access.GateLog
        {
            PersonName = request.PersonName,
            PersonType = request.PersonType,
            Purpose = request.Purpose,
            EntryTime = DateTimeOffset.UtcNow,
            IssuedBy = request.IssuedBy,
            Notes = request.Notes
        };
        db.GateLogs.Add(gateLog);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/gate/{gateLog.Id}", GateLogResponseDto.FromDomain(gateLog));
    }

    [HttpPatch("{id:guid}/exit")]
    public async Task<IActionResult> LogExit(Guid id, CancellationToken cancellationToken)
    {
        var gateLog = await db.GateLogs.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (gateLog is null) return NotFound();
        gateLog.ExitTime = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record GateLogResponseDto(Guid Id, string PersonName, string PersonType, string Purpose, DateTimeOffset EntryTime, DateTimeOffset? ExitTime, Guid? IssuedBy, string? Notes)
{
    public static GateLogResponseDto FromDomain(Domain.Access.GateLog gateLog) => new(
        gateLog.Id, gateLog.PersonName, gateLog.PersonType, gateLog.Purpose,
        gateLog.EntryTime, gateLog.ExitTime, gateLog.IssuedBy, gateLog.Notes);
}

public sealed record CreateGateLogRequest(string PersonName, string PersonType, string Purpose, Guid? IssuedBy, string? Notes);
