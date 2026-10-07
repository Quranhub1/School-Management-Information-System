using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/accounts-overview")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class AccountsOverviewController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var totalBilled = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)(x.Amount > x.DiscountAmount ? x.Amount - x.DiscountAmount : 0m), cancellationToken) ?? 0m;
        var totalPaid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        var todayUtc = new DateTimeOffset(DateTime.UtcNow.Date, TimeSpan.Zero);
        var tomorrowUtc = todayUtc.AddDays(1);
        var todayPayments = await db.Payments.AsNoTracking()
            .Where(p => p.PaidAt >= todayUtc && p.PaidAt < tomorrowUtc)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        return Ok(new
        {
            totalBilled,
            totalPaid,
            totalOutstanding = Math.Max(0m, totalBilled - totalPaid),
            todayCollection = todayPayments,
            invoiceCount = await db.StudentInvoices.LongCountAsync(cancellationToken),
            paymentCount = await db.Payments.LongCountAsync(cancellationToken),
            outstandingCount = await db.StudentInvoices.LongCountAsync(x => x.Amount - x.DiscountAmount - x.PaidAmount > 0, cancellationToken)
        });
    }

    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstanding(CancellationToken cancellationToken)
    {
        var data = await (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            join fee in db.FeeStructures.AsNoTracking() on invoice.FeeStructureId equals fee.Id into fees
            from fee in fees.DefaultIfEmpty()
            where invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount > 0