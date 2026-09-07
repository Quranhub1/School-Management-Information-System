using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Access;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/gate-passes")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public sealed class GatePassesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingGatePasses(CancellationToken cancellationToken)
    {
        var passes = await db.GatePasses.AsNoTracking()
            .Where(p => p.Status == "Pending")
            .OrderByDescending(p => p.IssuedAtUtc)
            .Select(p => new
            {
                p.Id,
                studentId = p.StudentId,
                studentNumber = p.Student.StudentNumber,
                studentName = p.Student.FirstName + " " + p.Student.LastName,
                p.PassType,
                p.Reason,
                p.Destination,
                p.ExpectedReturnDate,
                p.IssuedAtUtc,
                p.AuthorizedBy,
                p.ParentGuardianContact
            })
            .ToListAsync(cancellationToken);

        return Ok(passes);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentGatePasses(Guid studentId, CancellationToken cancellationToken)
    {
        var passes = await db.GatePasses.AsNoTracking()
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.IssuedAtUtc)
            .Select(p => new
            {
                p.Id,
                p.PassType,
                p.Reason,
                p.Destination,
                p.AuthorizedBy,
                p.ExpectedReturnDate,
                p.Status,
                p.IssuedAtUtc,
                p.ApprovedAtUtc,
                p.UsedAtUtc,
                p.ReturnedAtUtc,
                p.Notes
            })
            .ToListAsync(cancellationToken);

        return Ok(passes);
    }

    [HttpPost("request")]
    public async Task<IActionResult> RequestGatePass([FromBody] RequestGatePassRequest request, CancellationToken cancellationToken)
    {
        var gatePass = new GatePass
        {
            StudentId = request.StudentId,
            PassType = request.PassType,
            Reason = request.Reason,
            Destination = request.Destination,
            AuthorizedBy = request.AuthorizedBy,
            ParentGuardianContact = request.ParentGuardianContact,
            ExpectedReturnDate = request.ExpectedReturnDate,
            Status = "Pending",
            IssuedAtUtc = DateTimeOffset.UtcNow,
            Notes = request.Notes
        };

        db.GatePasses.Add(gatePass);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetStudentGatePasses), new { studentId = request.StudentId }, new { gatePass.Id });
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> ApproveGatePass(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();

        gatePass.Status = "Approved";
        gatePass.ApprovedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Gate pass approved." });
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectGatePass(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();

        gatePass.Status = "Rejected";
        gatePass.ApprovedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Gate pass rejected." });
    }

    [HttpPost("{id:guid}/use")]
    public async Task<IActionResult> MarkGatePassUsed(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();

        if (gatePass.Status != "Approved")
            return BadRequest(new { message = "Gate pass must be approved before use." });

        gatePass.Status = "Used";
        gatePass.UsedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Gate pass marked as used." });
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> MarkGatePassReturned(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();

        gatePass.Status = "Returned";
        gatePass.ReturnedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Gate pass marked as returned." });
    }
}

public sealed record RequestGatePassRequest(Guid StudentId, string PassType, string? Reason, string? Destination, string? AuthorizedBy, string? ParentGuardianContact, DateOnly ExpectedReturnDate, string? Notes);
