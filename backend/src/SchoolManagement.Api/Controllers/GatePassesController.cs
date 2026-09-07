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
        var passes = await (
            from pass in db.GatePasses.AsNoTracking()
            join student in db.Students.AsNoTracking() on pass.StudentId equals student.Id
            where pass.Status == "Pending"
            orderby pass.IssuedAtUtc descending
            select new { pass.Id, studentId = student.Id, studentNumber = student.StudentNumber, studentName = student.FirstName + " " + student.LastName, pass.PassType, pass.Reason, pass.Destination, pass.ExpectedReturnDate, pass.IssuedAtUtc, pass.AuthorizedBy, pass.ParentGuardianContact }
        ).ToListAsync(cancellationToken);
        return Ok(passes);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentGatePasses(Guid studentId, CancellationToken cancellationToken)
        => Ok(await db.GatePasses.AsNoTracking().Where(p => p.StudentId == studentId).OrderByDescending(p => p.IssuedAtUtc)
            .Select(p => new { p.Id, p.PassType, p.Reason, p.Destination, p.AuthorizedBy, p.ExpectedReturnDate, p.Status, p.IssuedAtUtc, p.ApprovedAtUtc, p.UsedAtUtc, p.ReturnedAtUtc, p.Notes }).ToListAsync(cancellationToken));

    [HttpPost("request")]
    public async Task<IActionResult> RequestGatePass([FromBody] RequestGatePassRequest request, CancellationToken cancellationToken)
    {
        if (!await db.Students.AnyAsync(s => s.Id == request.StudentId, cancellationToken)) return NotFound(new { message = "Student not found." });
        var gatePass = new GatePass { StudentId = request.StudentId, PassType = request.PassType.Trim(), Reason = request.Reason, Destination = request.Destination, AuthorizedBy = request.AuthorizedBy, ParentGuardianContact = request.ParentGuardianContact, ExpectedReturnDate = request.ExpectedReturnDate, Status = "Pending", Notes = request.Notes };
        db.GatePasses.Add(gatePass);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetStudentGatePasses), new { studentId = request.StudentId }, new { gatePass.Id });
    }

    [HttpPost("{id:guid}/approve")]
    public Task<IActionResult> ApproveGatePass(Guid id, CancellationToken cancellationToken) => SetStatus(id, "Approved", true, cancellationToken);

    [HttpPost("{id:guid}/reject")]
    public Task<IActionResult> RejectGatePass(Guid id, CancellationToken cancellationToken) => SetStatus(id, "Rejected", true, cancellationToken);

    [HttpPost("{id:guid}/use")]
    public async Task<IActionResult> MarkGatePassUsed(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();
        if (gatePass.Status != "Approved") return BadRequest(new { message = "Gate pass must be approved before use." });
        gatePass.Status = "Used"; gatePass.UsedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Gate pass marked as used." });
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> MarkGatePassReturned(Guid id, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();
        gatePass.Status = "Returned"; gatePass.ReturnedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Gate pass marked as returned." });
    }

    private async Task<IActionResult> SetStatus(Guid id, string status, bool stampApproval, CancellationToken cancellationToken)
    {
        var gatePass = await db.GatePasses.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (gatePass is null) return NotFound();
        gatePass.Status = status;
        if (stampApproval) gatePass.ApprovedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = $"Gate pass {status.ToLowerInvariant()}." });
    }
}

public sealed record RequestGatePassRequest(Guid StudentId, string PassType, string? Reason, string? Destination, string? AuthorizedBy, string? ParentGuardianContact, DateOnly ExpectedReturnDate, string? Notes);
