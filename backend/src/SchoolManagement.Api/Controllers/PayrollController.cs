using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Payroll;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff/payroll")]
[Authorize(Policy = StaffPolicies.Read)]
public sealed class PayrollController(SchoolManagementDbContext db, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? staffMemberId = null, CancellationToken cancellationToken = default)
    {
        var query = db.PayrollRecords.AsNoTracking();
        if (staffMemberId.HasValue) query = query.Where(x => x.StaffMemberId == staffMemberId.Value);
        return Ok(await query.OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var record = await db.PayrollRecords.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return record is null ? NotFound() : Ok(record);
    }

    [HttpPost("generate")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Generate([FromBody] GeneratePayrollRequest request, CancellationToken cancellationToken)
    {
        if (request.Month is < 1 or > 12) return BadRequest(new { message = "Month must be between 1 and 12." });
        if (request.Year < 2000) return BadRequest(new { message = "Year is invalid." });

        var staff = await db.StaffMembers.AsNoTracking().Where(x => x.IsActive).ToListAsync(cancellationToken);
        var basicSalary = configuration.GetValue<decimal>("PayrollDefaults:BasicSalary", 50000m);
        var deductions = configuration.GetValue<decimal>("PayrollDefaults:Deductions", 5000m);
        var periodStart = new DateOnly(request.Year, request.Month, 1);
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);

        foreach (var s in staff)
        {
            var existing = await db.PayrollRecords.AnyAsync(x => x.StaffMemberId == s.Id && x.Month == request.Month && x.Year == request.Year, cancellationToken);
            if (existing) continue;
            var allowances = await db.StaffAllowances.AsNoTracking()
                .Where(a => a.StaffMemberId == s.Id
                    && (a.Status == "Authorized" || a.Status == "Recorded")
                    && (a.Frequency == "Monthly"
                        ? a.EffectiveFrom <= periodEnd && (!a.EffectiveTo.HasValue || a.EffectiveTo.Value >= periodStart)
                        : a.EffectiveFrom >= periodStart && a.EffectiveFrom <= periodEnd))
                .SumAsync(a => (decimal?)a.Amount, cancellationToken) ?? 0m;
            db.PayrollRecords.Add(new Domain.Staff.PayrollRecord
            {
                StaffMemberId = s.Id,
                Month = request.Month,
                Year = request.Year,
                BasicSalary = basicSalary,
                Allowances = allowances,
                Deductions = deductions,
                NetPay = basicSalary + allowances - deductions,
                Status = "Pending"
            });
        }
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Payroll generated." });
    }

    [HttpPatch("{id:guid}/pay")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> MarkAsPaid(Guid id, [FromBody] MarkPayrollPaidRequest request, CancellationToken cancellationToken)
    {
        var record = await db.PayrollRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (record is null) return NotFound();
        record.PaymentDate = DateTimeOffset.UtcNow;
        record.Status = "Paid";
        record.PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? null : request.PaymentMethod.Trim();
        record.Reference = string.IsNullOrWhiteSpace(request.Reference) ? null : request.Reference.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/allowances")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> UpdateAllowances(Guid id, [FromBody] UpdateAllowancesRequest request, CancellationToken cancellationToken)
    {
        if (request.Allowances < 0 || request.Deductions < 0) return BadRequest(new { message = "Allowances and deductions cannot be negative." });
        var record = await db.PayrollRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (record is null) return NotFound();

        db.Entry(record).Property(x => x.Allowances).CurrentValue = request.Allowances;
        db.Entry(record).Property(x => x.Deductions).CurrentValue = request.Deductions;
        db.Entry(record).Property(x => x.NetPay).CurrentValue = record.BasicSalary + request.Allowances - request.Deductions;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record GeneratePayrollRequest(int Month, int Year);
public sealed record MarkPayrollPaidRequest(string? PaymentMethod, string? Reference);
public sealed record UpdateAllowancesRequest(decimal Allowances, decimal Deductions);
