using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/staff-allowances")]
[Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
public sealed class StaffAllowancesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? staffMemberId = null, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        var query = from allowance in db.StaffAllowances.AsNoTracking()
                    join staff in db.StaffMembers.AsNoTracking() on allowance.StaffMemberId equals staff.Id
                    select new
                    {
                        allowance.Id,
                        allowance.StaffMemberId,
                        staffName = staff.FirstName + " " + (staff.OtherNames ?? "") + " " + staff.LastName,
                        staff.StaffNumber,
                        allowance.AllowanceType,
                        allowance.Amount,
                        allowance.Currency,
                        allowance.EffectiveFrom,
                        allowance.EffectiveTo,
                        allowance.Frequency,
                        allowance.Reason,
                        allowance.Status,
                        allowance.AuthorizedBy,
                        allowance.AuthorizedAt,
                        allowance.RecordedBy,
                        allowance.RecordedAt,
                        allowance.Reference
                    };

        if (staffMemberId.HasValue) query = query.Where(x => x.StaffMemberId == staffMemberId.Value);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status.Trim());

        return Ok(await query.OrderByDescending(x => x.EffectiveFrom).ThenBy(x => x.staffName).ToListAsync(cancellationToken));
    }

    [HttpPost("authorize")]
    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    public async Task<IActionResult> AuthorizeAllowance(CreateAllowanceRequest request, CancellationToken cancellationToken)
    {
        if (request.StaffMemberId == Guid.Empty) return BadRequest(new { message = "Staff member is required." });
        if (string.IsNullOrWhiteSpace(request.AllowanceType)) return BadRequest(new { message = "Allowance type is required." });
        if (request.Amount <= 0) return BadRequest(new { message = "Allowance amount must be greater than zero." });
        if (request.EffectiveFrom == default) return BadRequest(new { message = "Effective date is required." });
        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value < request.EffectiveFrom) return BadRequest(new { message = "Effective-to date cannot be before effective-from date." });

        var staffExists = await db.StaffMembers.AnyAsync(x => x.Id == request.StaffMemberId && x.IsActive, cancellationToken);
        if (!staffExists) return NotFound(new { message = "Active staff member was not found." });

        var user = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required." });

        var allowance = new StaffAllowance
        {
            StaffMemberId = request.StaffMemberId,
            AllowanceType = request.AllowanceType.Trim(),
            Amount = decimal.Round(request.Amount, 2, MidpointRounding.AwayFromZero),
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "UGX" : request.Currency.Trim().ToUpperInvariant(),
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            Frequency = string.IsNullOrWhiteSpace(request.Frequency) ? "Monthly" : request.Frequency.Trim(),
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim(),
            Status = "Authorized",
            AuthorizedBy = user,
            AuthorizedAt = DateTimeOffset.UtcNow,
            Reference = string.IsNullOrWhiteSpace(request.Reference) ? null : request.Reference.Trim()
        };

        db.StaffAllowances.Add(allowance);
        db.FinanceAuditEvents.Add(new FinanceAuditEvent
        {
            Action = "StaffAllowanceAuthorized",
            EntityType = nameof(StaffAllowance),
            EntityId = allowance.Id,
            PerformedBy = user,
            Reason = allowance.Reason,
            Metadata = $"StaffMemberId={allowance.StaffMemberId};Amount={allowance.Amount};Currency={allowance.Currency};Type={allowance.AllowanceType}"
        });

        await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/finance/staff-allowances/{allowance.Id}", allowance);
    }

    [HttpPost("{id:guid}/record")]
    public async Task<IActionResult> RecordAllowance(Guid id, CancellationToken cancellationToken)
    {
        var allowance = await db.StaffAllowances.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (allowance is null) return NotFound(new { message = "Allowance was not found." });
        if (!string.Equals(allowance.Status, "Authorized", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only an authorized allowance can be recorded." });

        var user = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required." });

        allowance.Status = "Recorded";
        allowance.RecordedBy = user;
        allowance.RecordedAt = DateTimeOffset.UtcNow;

        db.FinanceAuditEvents.Add(new FinanceAuditEvent
        {
            Action = "StaffAllowanceRecorded",
            EntityType = nameof(StaffAllowance),
            EntityId = allowance.Id,
            PerformedBy = user,
            Reason = allowance.Reason,
            Metadata = $"StaffMemberId={allowance.StaffMemberId};Amount={allowance.Amount};Currency={allowance.Currency};Type={allowance.AllowanceType}"
        });

        await db.SaveChangesAsync(cancellationToken);
        return Ok(allowance);
    }
}

public sealed record CreateAllowanceRequest(
    Guid StaffMemberId,
    string AllowanceType,
    decimal Amount,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo = null,
    string Frequency = "Monthly",
    string Currency = "UGX",
    string? Reason = null,
    string? Reference = null);
