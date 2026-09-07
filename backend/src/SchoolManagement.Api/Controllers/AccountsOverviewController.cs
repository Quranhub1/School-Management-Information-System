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
        var totalBilled = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.NetAmount, cancellationToken) ?? 0m;
        var totalPaid = await db.StudentInvoices.AsNoTracking().SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayPayments = await db.Payments.AsNoTracking()
            .Where(p => p.PaidAt.UtcDateTime.Date == today.ToDateTime(TimeOnly.MinValue).Date)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        return Ok(new
        {
            totalBilled,
            totalPaid,
            totalOutstanding = Math.Max(0m, totalBilled - totalPaid),
            todayCollection = todayPayments,
            invoiceCount = await db.StudentInvoices.LongCountAsync(cancellationToken),
            paymentCount = await db.Payments.LongCountAsync(cancellationToken),
            outstandingCount = await db.StudentInvoices.LongCountAsync(x => x.OutstandingAmount > 0, cancellationToken)
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
            where invoice.OutstandingAmount > 0
            select new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName,
                programmeName = fee == null ? invoice.FeeType : fee.Name,
                balance = invoice.OutstandingAmount,
                invoice.Currency,
                invoice.Status
            })
            .ToListAsync(cancellationToken);

        return Ok(data);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] string? receiptNumber, [FromQuery] string? paymentMethod, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        var query =
            from payment in db.Payments.AsNoTracking()
            join student in db.Students.AsNoTracking() on payment.StudentId equals student.Id
            join invoice in db.StudentInvoices.AsNoTracking() on payment.StudentInvoiceId equals invoice.Id into invoices
            from invoice in invoices.DefaultIfEmpty()
            select new { payment, student, invoice };

        if (!string.IsNullOrWhiteSpace(receiptNumber))
            query = query.Where(x => x.payment.ReceiptNumber.Contains(receiptNumber.Trim()));
        if (!string.IsNullOrWhiteSpace(paymentMethod))
            query = query.Where(x => x.payment.PaymentMethod == paymentMethod.Trim());
        if (from.HasValue)
            query = query.Where(x => x.payment.PaidAt >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue)
            query = query.Where(x => x.payment.PaidAt <= to.Value.ToDateTime(TimeOnly.MaxValue));

        var payments = await query.OrderByDescending(x => x.payment.PaidAt)
            .Select(x => new
            {
                x.payment.Id,
                x.payment.ReceiptNumber,
                x.payment.Amount,
                x.payment.PaymentMethod,
                x.payment.Reference,
                x.payment.PaidAt,
                studentName = x.student.FirstName + " " + (x.student.OtherNames ?? "") + " " + x.student.LastName,
                invoiceNumber = x.invoice == null ? null : x.invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        return Ok(payments);
    }

    [HttpGet("payroll")]
    public async Task<IActionResult> GetPayroll([FromQuery] int? month, [FromQuery] int? year, CancellationToken cancellationToken)
    {
        var query =
            from payroll in db.PayrollRecords.AsNoTracking()
            join staff in db.StaffMembers.AsNoTracking() on payroll.StaffMemberId equals staff.Id
            select new { payroll, staff };

        if (month.HasValue) query = query.Where(x => x.payroll.Month == month.Value);
        if (year.HasValue) query = query.Where(x => x.payroll.Year == year.Value);

        var records = await query
            .OrderByDescending(x => x.payroll.Year)
            .ThenByDescending(x => x.payroll.Month)
            .Select(x => new
            {
                x.payroll.Id,
                x.payroll.StaffMemberId,
                staffName = x.staff.FirstName + " " + x.staff.LastName,
                x.staff.StaffNumber,
                x.payroll.Month,
                x.payroll.Year,
                x.payroll.BasicSalary,
                x.payroll.Allowances,
                x.payroll.Deductions,
                x.payroll.NetPay,
                x.payroll.Status,
                x.payroll.PaymentDate,
                x.payroll.PaymentMethod,
                x.payroll.Reference
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
                x.FeeType,
                x.Amount,
                x.PaidAmount,
                balance = x.OutstandingAmount,
                x.Currency,
                x.Status,
                x.IssuedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(invoices);
    }
}
