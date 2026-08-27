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
        var totalBilled = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var totalPaid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayPayments = await db.Payments
            .Where(p => DateOnly.FromDateTime(p.PaidAt) == today)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        return Ok(new
        {
            totalBilled,
            totalPaid,
            totalOutstanding = totalBilled - totalPaid,
            todayCollection = todayPayments,
            invoiceCount = await db.StudentInvoices.LongCountAsync(cancellationToken),
            paymentCount = await db.Payments.LongCountAsync(cancellationToken),
            outstandingCount = await db.StudentInvoices.CountAsync(x => x.PaidAmount < x.Amount, cancellationToken)
        });
    }

    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstanding(CancellationToken cancellationToken)
    {
        var data = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .Select(x => new
            {
                studentId = x.StudentId,
                studentNumber = x.Student.StudentNumber,
                studentName = x.Student.FirstName + " " + x.Student.OtherNames + " " + x.Student.LastName,
                programmeName = x.FeeStructure.Name,
                balance = x.Amount - x.PaidAmount,
                currency = x.Currency,
                status = x.Status
            })
            .ToListAsync(cancellationToken);

        return Ok(data);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] string? receiptNumber, [FromQuery] string? paymentMethod, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var query = db.Payments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(receiptNumber))
            query = query.Where(p => p.ReceiptNumber.Contains(receiptNumber.Trim()));

        if (!string.IsNullOrWhiteSpace(paymentMethod))
            query = query.Where(p => p.PaymentMethod == paymentMethod.Trim());

        if (from.HasValue)
            query = query.Where(p => p.PaidAt.Date >= from.Value.ToDateTime(TimeOnly.MinValue));

        if (to.HasValue)
            query = query.Where(p => p.PaidAt.Date <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var payments = await query
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new
            {
                p.Id,
                p.ReceiptNumber,
                p.Amount,
                p.PaymentMethod,
                p.Reference,
                p.PaidAt,
                studentName = p.StudentInvoice.Student.FirstName + " " + p.StudentInvoice.Student.OtherNames + " " + p.StudentInvoice.Student.LastName,
                invoiceNumber = p.StudentInvoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        return Ok(payments);
    }

    [HttpGet("payroll")]
    public async Task<IActionResult> GetPayroll([FromQuery] int? month, [FromQuery] int? year, CancellationToken cancellationToken)
    {
        var query = db.PayrollRecords.AsNoTracking().AsQueryable();

        if (month.HasValue)
            query = query.Where(x => x.Month == month.Value);

        if (year.HasValue)
            query = query.Where(x => x.Year == year.Value);

        var records = await query
            .OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.Month)
            .Select(x => new
            {
                x.Id,
                x.StaffMemberId,
                staffName = x.StaffMember.FirstName + " " + x.StaffMember.LastName,
                staffNumber = x.StaffMember.StaffNumber,
                x.Month,
                x.Year,
                x.BasicSalary,
                x.Allowances,
                x.Deductions,
                x.NetPay,
                x.Status,
                x.PaymentDate,
                x.PaymentMethod,
                x.Reference
            })
            .ToListAsync(cancellationToken);

        return Ok(records);
    }

    [HttpGet("students/{studentId:guid}/invoices")]
    public async Task<IActionResult> GetStudentInvoices(Guid studentId, CancellationToken cancellationToken)
    {
        var invoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IssuedAt)
            .Select(x => new
            {
                x.Id,
                x.InvoiceNumber,
                x.Amount,
                x.PaidAmount,
                balance = x.Amount - x.PaidAmount,
                x.Currency,
                x.Status,
                x.IssuedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(invoices);
    }
}