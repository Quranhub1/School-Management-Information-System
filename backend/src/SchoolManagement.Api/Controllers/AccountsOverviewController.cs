using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Administration;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/accounts-overview")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class AccountsOverviewController(SchoolManagementDbContext db, CampusAccessService campusAccess, InstitutionSettingsService institutionSettings) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var systemCurrency = (await institutionSettings.GetSystemCurrencyAsync(cancellationToken)).Code;
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var invoices = db.StudentInvoices.AsNoTracking().AsQueryable();
        var payments = db.Payments.AsNoTracking().AsQueryable();
        if (accessibleCampuses is not null)
        {
            invoices = invoices.Where(x => db.Students.Any(student => student.Id == x.StudentId && student.CampusId.HasValue && accessibleCampuses.Contains(student.CampusId.Value)));
            payments = payments.Where(x => db.Students.Any(student => student.Id == x.StudentId && student.CampusId.HasValue && accessibleCampuses.Contains(student.CampusId.Value)));
        }

        var invoiceTotals = await invoices
            .GroupBy(x => x.Currency.Trim().ToUpper())
            .Select(group => new
            {
                currency = group.Key,
                billed = group.Sum(x => x.Amount > x.DiscountAmount ? x.Amount - x.DiscountAmount : 0m),
                paid = group.Sum(x => x.PaidAmount)
            })
            .ToListAsync(cancellationToken);

        var ugandaDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        var todayStartUtc = new DateTimeOffset(ugandaDate.ToDateTime(TimeOnly.MinValue), TimeSpan.FromHours(3)).ToUniversalTime();
        var tomorrowStartUtc = todayStartUtc.AddDays(1);
        var collectionTotals = await payments
            .Where(p => p.PaidAt >= todayStartUtc && p.PaidAt < tomorrowStartUtc)
            .GroupBy(p => p.Currency.Trim().ToUpper())
            .Select(group => new { currency = group.Key, amount = group.Sum(x => x.Amount) })
            .ToListAsync(cancellationToken);

        var defaultCurrencyTotals = invoiceTotals.FirstOrDefault(x => x.currency == systemCurrency);
        var totalBilled = defaultCurrencyTotals?.billed ?? 0m;
        var totalPaid = defaultCurrencyTotals?.paid ?? 0m;
        var todayCollection = collectionTotals.FirstOrDefault(x => x.currency == systemCurrency)?.amount ?? 0m;

        return Ok(new
        {
            totalBilled,
            totalPaid,
            totalOutstanding = Math.Max(0m, totalBilled - totalPaid),
            todayCollection,
            currency = systemCurrency,
            totalsByCurrency = invoiceTotals.Select(x => new
            {
                x.currency,
                x.billed,
                x.paid,
                balance = Math.Max(0m, x.billed - x.paid)
            }),
            collectionsByCurrency = collectionTotals,
            invoiceCount = await invoices.LongCountAsync(cancellationToken),
            paymentCount = await payments.LongCountAsync(cancellationToken),
            outstandingCount = await invoices.LongCountAsync(
                x => x.Amount - x.DiscountAmount - x.PaidAmount > 0,
                cancellationToken)
        });
    }

    [HttpGet("overdue")]
    public async Task<IActionResult> GetOverdue(CancellationToken cancellationToken)
    {
        var systemCurrency = (await institutionSettings.GetSystemCurrencyAsync(cancellationToken)).Code;
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var asOf = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        var query =
            from installment in db.Set<SchoolManagement.Domain.Finance.InvoiceInstallment>().AsNoTracking()
            join invoice in db.StudentInvoices.AsNoTracking()
                on installment.StudentInvoiceId equals invoice.Id
            where installment.DueDate < asOf
                && installment.Amount > installment.PaidAmount
                && invoice.Currency.Trim().ToUpper() == systemCurrency
            select new
            {
                invoice.StudentId,
                outstanding = installment.Amount - installment.PaidAmount
            };

        if (accessibleCampuses is not null)
            query = query.Where(x => db.Students.Any(student =>
                student.Id == x.StudentId && student.CampusId.HasValue &&
                accessibleCampuses.Contains(student.CampusId.Value)));

        var overdueRows = await query.ToListAsync(cancellationToken);
        return Ok(new
        {
            asOf,
            currency = systemCurrency,
            installmentCount = overdueRows.Count,
            studentCount = overdueRows.Select(x => x.StudentId).Distinct().Count(),
            totalOutstanding = overdueRows.Sum(x => x.outstanding)
        });
    }

    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstanding(CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var outstandingQuery = (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking()
                on invoice.StudentId equals student.Id
            join fee in db.FeeStructures.AsNoTracking()
                on invoice.FeeStructureId equals fee.Id into fees
            from fee in fees.DefaultIfEmpty()
            where invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount > 0
            select new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = (student.LastName + " " + student.FirstName + (student.OtherNames == null || student.OtherNames == "" ? "" : " " + student.OtherNames)).ToUpper(),
                programmeName = fee == null ? invoice.FeeType : fee.Name,
                balance = invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount,
                invoice.Currency,
                invoice.Status
            });
        if (accessibleCampuses is not null)
            outstandingQuery = outstandingQuery.Where(x => db.Students.Any(student => student.Id == x.studentId && student.CampusId.HasValue && accessibleCampuses.Contains(student.CampusId.Value)));
        var data = await outstandingQuery.ToListAsync(cancellationToken);

        return Ok(data);
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] Guid? studentId,
        [FromQuery] string? receiptNumber,
        [FromQuery] string? paymentMethod,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var query =
            from payment in db.Payments.AsNoTracking()
            join student in db.Students.AsNoTracking()
                on payment.StudentId equals student.Id
            join invoice in db.StudentInvoices.AsNoTracking()
                on payment.StudentInvoiceId equals invoice.Id into invoices
            from invoice in invoices.DefaultIfEmpty()
            select new { payment, student, invoice };

        if (accessibleCampuses is not null)
            query = query.Where(x => x.student.CampusId.HasValue && accessibleCampuses.Contains(x.student.CampusId.Value));

        if (studentId.HasValue)
            query = query.Where(x => x.payment.StudentId == studentId.Value);

        if (!string.IsNullOrWhiteSpace(receiptNumber))
            query = query.Where(x => x.payment.ReceiptNumber.Contains(receiptNumber.Trim()));

        if (!string.IsNullOrWhiteSpace(paymentMethod))
            query = query.Where(x => x.payment.PaymentMethod == paymentMethod.Trim());

        if (from.HasValue)
        {
            var fromUtc = new DateTimeOffset(
                from.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
            query = query.Where(x => x.payment.PaidAt >= fromUtc);
        }

        if (to.HasValue)
        {
            var toUtcExclusive = new DateTimeOffset(
                to.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
            query = query.Where(x => x.payment.PaidAt < toUtcExclusive);
        }

        var payments = await query
            .OrderByDescending(x => x.payment.PaidAt)
            .Select(x => new
            {
                x.payment.Id,
                x.payment.ReceiptNumber,
                x.payment.Amount,
                x.payment.Currency,
                x.payment.PaymentMethod,
                x.payment.PaymentSource,
                x.payment.SourceChannel,
                x.payment.ProviderTransactionId,
                x.payment.Reference,
                x.payment.PaidAt,
                studentName = (x.student.LastName + " " + x.student.FirstName + (x.student.OtherNames == null || x.student.OtherNames == "" ? "" : " " + x.student.OtherNames)).ToUpper(),
                invoiceNumber = x.invoice == null ? null : x.invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        return Ok(payments);
    }

    [HttpGet("payroll")]
    [Authorize(Policy = AuthorizationPolicies.PayrollRead)]
    public async Task<IActionResult> GetPayroll(
        [FromQuery] Guid? staffMemberId,
        [FromQuery] int? month,
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var query =
            from payroll in db.PayrollRecords.AsNoTracking()
            join staff in db.StaffMembers.AsNoTracking()
                on payroll.StaffMemberId equals staff.Id
            select new { payroll, staff };

        if (accessibleCampuses is not null)
            query = query.Where(x => x.staff.CampusId.HasValue && accessibleCampuses.Contains(x.staff.CampusId.Value));

        if (staffMemberId.HasValue)
            query = query.Where(x => x.payroll.StaffMemberId == staffMemberId.Value);
        if (month.HasValue)
            query = query.Where(x => x.payroll.Month == month.Value);
        if (year.HasValue)
            query = query.Where(x => x.payroll.Year == year.Value);

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
                x.payroll.Currency,
                x.payroll.Status,
                x.payroll.PaymentDate,
                x.payroll.PaymentMethod,
                x.payroll.Reference
            })
            .ToListAsync(cancellationToken);

        return Ok(records);
    }

    [HttpGet("students/{studentId:guid}/invoices")]
    public async Task<IActionResult> GetStudentInvoices(
        Guid studentId,
        CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();

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
                balance = x.Amount - x.DiscountAmount - x.PaidAmount,
                x.Currency,
                x.Status,
                x.IssuedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(invoices);
    }
}
