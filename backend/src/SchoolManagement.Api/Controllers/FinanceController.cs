using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceController(FinanceWorkflowService finance, InvoiceDiscountService discounts, InvoiceInstallmentService installments, StudentChargeService charges, CreditNoteRefundService adjustments, FinanceReportService reports, CashBankPositionReportService cashBankPosition, ReceivablesReportService receivables, JournalReversalService reversals, SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? studentId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(studentId))
        {
            var invoices = await db.StudentInvoices.AsNoTracking()
                .OrderByDescending(x => x.IssuedAt)
                .Select(x => new
                {
                    x.Id,
                    x.StudentId,
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

        var value = studentId.Trim();
        var student = Guid.TryParse(value, out var parsedId)
            ? await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == parsedId, cancellationToken)
            : await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.StudentNumber == value, cancellationToken);

        if (student is null) return NotFound(new { message = "Student was not found." });

        return Ok(await finance.GetStudentInvoicesAsync(student.Id, cancellationToken));
    }

    // Compatibility endpoints for older frontend builds. The canonical accounts-overview
    // endpoints remain available, while these aliases prevent stale clients from receiving 404s.
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardCompatibility(CancellationToken cancellationToken)
    {
        var totalBilled = await db.StudentInvoices.AsNoTracking()
            .SumAsync(x => (decimal?)(x.Amount > x.DiscountAmount ? x.Amount - x.DiscountAmount : 0m), cancellationToken) ?? 0m;
        var totalPaid = await db.StudentInvoices.AsNoTracking()
            .SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
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
            outstandingCount = await db.StudentInvoices.LongCountAsync(x => x.Amount - x.DiscountAmount - x.PaidAmount > 0, cancellationToken),
            currency = "UGX"
        });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPaymentsCompatibility([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        var query =
            from payment in db.Payments.AsNoTracking()
            join student in db.Students.AsNoTracking() on payment.StudentId equals student.Id
            join invoice in db.StudentInvoices.AsNoTracking() on payment.StudentInvoiceId equals invoice.Id into invoices
            from invoice in invoices.DefaultIfEmpty()
            select new { payment, student, invoice };

        if (studentId.HasValue) query = query.Where(x => x.payment.StudentId == studentId.Value);

        return Ok(await query
            .OrderByDescending(x => x.payment.PaidAt)
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
            .ToListAsync(cancellationToken));
    }

    [HttpGet("reports/outstanding-balances")]
    public async Task<IActionResult> GetOutstandingBalancesCompatibility(CancellationToken cancellationToken)
    {
        var data = await (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            join fee in db.FeeStructures.AsNoTracking() on invoice.FeeStructureId equals fee.Id into fees
            from fee in fees.DefaultIfEmpty()
            where invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount > 0
            select new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName,
                programmeName = fee == null ? invoice.FeeType : fee.Name,
                amount = invoice.Amount,
                paidAmount = invoice.PaidAmount,
                balance = invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount,
                invoice.Currency,
                invoice.Status
            })
            .ToListAsync(cancellationToken);

        return Ok(data);
    }
    [HttpGet("students/profile")]
    public async Task<IActionResult> GetStudentProfile([FromQuery] string studentIdOrNumber, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(studentIdOrNumber)) return BadRequest(new { message = "Student ID or number is required." });
        var value = studentIdOrNumber.Trim();
        var student = Guid.TryParse(value, out var id)
            ? await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            : await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.StudentNumber == value, cancellationToken);
        if (student is null) return NotFound(new { message = "Student was not found." });
        return Ok(new { student.Id, student.StudentNumber, name = string.Join(" ", new[] { student.FirstName, student.OtherNames, student.LastName }.Where(x => !string.IsNullOrWhiteSpace(x))), student.PhoneNumber, student.Email, student.Status });
    }

    [HttpGet("administration/accounts")]
    public async Task<IActionResult> GetFinanceAccounts(CancellationToken cancellationToken)
    {
        var accounts = await db.Accounts.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.AccountType).ThenBy(x => x.Code)
            .Select(x => new { x.Id, x.Code, x.Name, x.AccountType })
            .ToListAsync(cancellationToken);
        return Ok(accounts);
    }

    [HttpGet("administration/fee-structures")]
    public async Task<IActionResult> GetFeeStructures([FromQuery] Guid? academicYearId, CancellationToken cancellationToken)
    {
        var query = db.FeeStructures.AsNoTracking().Include(x => x.Items).AsQueryable();
        if (academicYearId.HasValue) query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken));
    }

    [HttpPost("administration/fee-structures")]
    public async Task<IActionResult> CreateFeeStructure(CreateFeeStructureRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Fee name is required." });
            if (string.IsNullOrWhiteSpace(request.FeeType)) return BadRequest(new { message = "Fee type is required." });
            if (request.Items is null || request.Items.Count == 0) return BadRequest(new { message = "At least one fee item is required." });
            if (request.Items.Any(x => x.Amount <= 0)) return BadRequest(new { message = "Every fee item must have a positive amount." });
            if (request.Items.GroupBy(x => x.Code.Trim(), StringComparer.OrdinalIgnoreCase).Any(g => g.Count() > 1)) return BadRequest(new { message = "Fee item codes must be unique." });

            var structure = new SchoolManagement.Domain.Finance.FeeStructure
            {
                ProgrammeId = request.ProgrammeId ?? Guid.Empty,
                AcademicYearId = request.AcademicYearId ?? Guid.Empty,
                Name = request.Name.Trim(),
                FeeType = request.FeeType.Trim(),
                Currency = (request.Currency ?? "UGX").Trim().ToUpperInvariant()
            };

            foreach (var item in request.Items.OrderBy(x => x.SortOrder))
            {
                structure.Items.Add(new SchoolManagement.Domain.Finance.FeeStructureItem
                {
                    FeeStructureId = structure.Id,
                    Code = item.Code.Trim(),
                    Name = item.Name.Trim(),
                    Amount = decimal.Round(item.Amount, 2, MidpointRounding.AwayFromZero),
                    Currency = structure.Currency,
                    IncomeAccountId = item.IncomeAccountId,
                    SortOrder = item.SortOrder,
                    IsOptional = item.IsOptional
                });
            }
            structure.RecalculateTotal();
            if (structure.TotalAmount <= 0) return BadRequest(new { message = "Fee structure total must be greater than zero." });

            db.FeeStructures.Add(structure);
            await db.SaveChangesAsync(cancellationToken);
            return Created($"/api/finance/administration/fee-structures/{structure.Id}", structure);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("administration/fee-structures/{feeStructureId:guid}/apply")]
    public async Task<IActionResult> ApplyFeeStructure(Guid feeStructureId, ApplyFeeStructureRequest request, CancellationToken cancellationToken)
    {
        var fee = await db.FeeStructures.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);
        if (fee is null) return NotFound(new { message = "Active fee structure was not found." });

        var studentIds = request.StudentIds?.Where(x => x != Guid.Empty).Distinct().ToArray();
        if (request.AllActiveStudents)
            studentIds = await db.Students.AsNoTracking().Where(x => x.Status == "Active").Select(x => x.Id).ToArrayAsync(cancellationToken);
        if (studentIds is null || studentIds.Length == 0) return BadRequest(new { message = "Select at least one student or apply to all active students." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var applied = 0;
        var skipped = 0;
        try
        {
            foreach (var studentId in studentIds)
            {
                var alreadyApplied = await db.StudentInvoices.AnyAsync(x => x.StudentId == studentId && x.FeeStructureId == fee.Id, cancellationToken);
                if (alreadyApplied) { skipped++; continue; }

                var studentNumber = await db.Students.AsNoTracking().Where(x => x.Id == studentId).Select(x => x.StudentNumber).SingleOrDefaultAsync(cancellationToken);
                if (studentNumber is null) { skipped++; continue; }

                var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{studentNumber}-{Guid.NewGuid():N}"[..Math.Min(50, $"INV-{DateTime.UtcNow:yyyyMMdd}-{studentNumber}-{Guid.NewGuid():N}".Length)];
                await finance.CreateInvoiceAsync(studentId, fee.Id, invoiceNumber, cancellationToken);
                applied++;
            }
            await transaction.CommitAsync(cancellationToken);
            return Ok(new { feeStructureId, applied, skipped, totalRequested = studentIds.Length });
        }
        catch (ArgumentException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequest(new { message = ex.Message, applied, skipped });
        }
        catch (InvalidOperationException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict(new { message = ex.Message, applied, skipped });
        }
    }

    [HttpGet("students/{studentId:guid}/ledger")]
    public async Task<IActionResult> GetStudentLedger(Guid studentId, CancellationToken cancellationToken) => Ok(await finance.GetStudentLedgerAsync(studentId, cancellationToken));
    [HttpGet("reports/receivables-ageing")]
    public async Task<IActionResult> ReceivablesAgeing([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default) { try { return Ok(await receivables.GetAgeingAsync(asOf, currency, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
    [HttpGet("reports/receivables-reconciliation")]
    public async Task<IActionResult> ReceivablesReconciliation([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default) { try { return Ok(await receivables.GetReconciliationAsync(asOf, currency, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpGet("reports/cash-bank-position")]
    public async Task<IActionResult> CashBankPosition([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] string currency = "UGX", [FromQuery] Guid? campusId = null, [FromQuery] Guid? facultyId = null, [FromQuery] Guid? departmentId = null, [FromQuery] Guid? programmeId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await cashBankPosition.GetAsync(from, to, currency, cancellationToken, campusId, facultyId, departmentId, programmeId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpGet("students/{studentId:guid}/charges")]
    public async Task<IActionResult> GetStudentCharges(Guid studentId, CancellationToken cancellationToken) { try { return Ok(await charges.GetStudentChargesAsync(studentId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }
    [HttpPost("students/{studentId:guid}/charges")]
    public async Task<IActionResult> CreateStudentCharge(Guid studentId, CreateStudentChargeRequest request, CancellationToken cancellationToken) { try { var charge = await charges.CreateAsync(studentId, request.ChargeType, request.Description, request.Amount, request.Currency, User.Identity?.Name, cancellationToken); return Created($"/api/finance/students/{studentId}/charges/{charge.Id}", charge); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("charges/{chargeId:guid}/void")]
    public async Task<IActionResult> VoidStudentCharge(Guid chargeId, VoidStudentChargeRequest request, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a charge void." }); return Ok(await charges.VoidAsync(chargeId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpGet("invoices/{invoiceId:guid}/credit-notes")]
    public async Task<IActionResult> GetCreditNotes(Guid invoiceId, CancellationToken cancellationToken) => Ok(await adjustments.GetCreditNotesAsync(invoiceId, cancellationToken));
    [HttpPost("invoices/{invoiceId:guid}/credit-notes")]
    public async Task<IActionResult> CreateCreditNote(Guid invoiceId, CreateCreditNoteRequest request, CancellationToken cancellationToken) { try { return Created($"/api/finance/invoices/{invoiceId}/credit-notes", await adjustments.CreateCreditNoteAsync(invoiceId, request.Amount, request.Reason, User.Identity?.Name, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("credit-notes/{creditNoteId:guid}/cancel")]
    public async Task<IActionResult> CancelCreditNote(Guid creditNoteId, CancelCreditNoteRequest request, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a credit note cancellation." }); return Ok(await adjustments.CancelCreditNoteAsync(creditNoteId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("payments/{paymentId:guid}/refund")]
    public async Task<IActionResult> RefundPayment(Guid paymentId, CreateRefundRequest request, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a refund." }); return Ok(await adjustments.CreateRefundAsync(paymentId, request.Amount, request.RefundMethod, request.Reason, request.Reference, user, request.CreditNoteId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken) { try { var invoice = await finance.CreateInvoiceAsync(request.StudentId, request.FeeStructureId, request.InvoiceNumber, cancellationToken); return Created($"/api/finance/invoices/{invoice.Id}", invoice); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpGet("invoices/{invoiceId:guid}/discounts")]
    public async Task<IActionResult> GetDiscounts(Guid invoiceId, CancellationToken cancellationToken) => Ok(await discounts.GetAsync(invoiceId, cancellationToken));
    [HttpPost("invoices/{invoiceId:guid}/discounts")]
    public async Task<IActionResult> RequestDiscount(Guid invoiceId, RequestDiscountRequest request, CancellationToken cancellationToken) { try { return Ok(await discounts.RequestAsync(invoiceId, request.DiscountType, request.Percentage, request.Amount, request.Reason, User.Identity?.Name, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("discounts/{discountId:guid}/approve")]
    public async Task<IActionResult> ApproveDiscount(Guid discountId, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for approval." }); return Ok(await discounts.ApproveAsync(discountId, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("discounts/{discountId:guid}/reject")]
    public async Task<IActionResult> RejectDiscount(Guid discountId, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for rejection." }); return Ok(await discounts.RejectAsync(discountId, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpGet("invoices/{invoiceId:guid}/installments")]
    public async Task<IActionResult> GetInstallments(Guid invoiceId, CancellationToken cancellationToken) => Ok(await installments.GetAsync(invoiceId, cancellationToken));
    [HttpGet("invoices/{invoiceId:guid}/installments/overdue")]
    public async Task<IActionResult> GetOverdueInstallments(Guid invoiceId, [FromQuery] DateOnly? asOf, CancellationToken cancellationToken) => Ok(await installments.GetOverdueAsync(invoiceId, asOf ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));
    [HttpPost("invoices/{invoiceId:guid}/installments")]
    public async Task<IActionResult> CreateInstallmentSchedule(Guid invoiceId, CreateInstallmentScheduleRequest request, CancellationToken cancellationToken) { try { return Ok(await installments.CreateScheduleAsync(invoiceId, request.Installments, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("invoices/{invoiceId:guid}/payments")]
    public async Task<IActionResult> RecordPayment(Guid invoiceId, RecordPaymentRequest request, CancellationToken cancellationToken) { try { return Ok(await finance.RecordPaymentAsync(invoiceId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Reference, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("students/{studentId:guid}/payments")]
    public async Task<IActionResult> RecordUnallocatedPayment(Guid studentId, RecordUnallocatedPaymentRequest request, CancellationToken cancellationToken) { try { return Ok(await finance.RecordUnallocatedPaymentAsync(studentId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Currency, request.Reference, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("payments/{paymentId:guid}/allocate")]
    public async Task<IActionResult> AllocatePayment(Guid paymentId, AllocatePaymentRequest request, CancellationToken cancellationToken) { try { return Ok(await finance.AllocatePaymentAsync(paymentId, request.Allocations, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("payments/{paymentId:guid}/allocate-fifo")]
    public async Task<IActionResult> AllocatePaymentFifo(Guid paymentId, CancellationToken cancellationToken) { try { return Ok(await finance.AllocatePaymentFifoAsync(paymentId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpPost("journal-entries/{journalEntryId:guid}/reverse")]
    public async Task<IActionResult> ReverseJournalEntry(Guid journalEntryId, ReverseJournalEntryRequest request, CancellationToken cancellationToken) { try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a reversal." }); return Ok(await reversals.ReverseAsync(journalEntryId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); } }
    [HttpGet("reports/general-ledger")]
    public async Task<IActionResult> GeneralLedger([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? accountId, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken) => Ok(await reports.GetGeneralLedgerAsync(from, to, accountId, cancellationToken, campusId, facultyId, departmentId, programmeId));
    [HttpGet("reports/trial-balance")]
    public async Task<IActionResult> TrialBalance([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken) => Ok(await reports.GetTrialBalanceAsync(from, to, cancellationToken, campusId, facultyId, departmentId, programmeId));
    [HttpGet("reports/income-statement")]
    public async Task<IActionResult> IncomeStatement([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken) => Ok(await reports.GetIncomeStatementAsync(from, to, cancellationToken, campusId, facultyId, departmentId, programmeId));
    [HttpGet("reports/balance-sheet")]
    public async Task<IActionResult> BalanceSheet([FromQuery] DateOnly? asOf, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken) => Ok(await reports.GetBalanceSheetAsync(asOf, cancellationToken, campusId, facultyId, departmentId, programmeId));
    [HttpGet("reports/student-receivables")]
    public async Task<IActionResult> StudentReceivables(CancellationToken cancellationToken) => Ok(await reports.GetStudentReceivablesAsync(cancellationToken));

    public sealed record CreateInvoiceRequest(Guid StudentId, Guid FeeStructureId, string InvoiceNumber);
    public sealed record FeeStructureItemRequest(string Code, string Name, decimal Amount, Guid? IncomeAccountId = null, int SortOrder = 0, bool IsOptional = false);
    public sealed record CreateFeeStructureRequest(string Name, string FeeType, string? Currency, Guid? ProgrammeId, Guid? AcademicYearId, IReadOnlyCollection<FeeStructureItemRequest> Items);
    public sealed record ApplyFeeStructureRequest(IReadOnlyCollection<Guid>? StudentIds = null, bool AllActiveStudents = false);
    public sealed record CreateStudentChargeRequest(string ChargeType, string Description, decimal Amount, string Currency = "UGX");
    public sealed record VoidStudentChargeRequest(string Reason);
    public sealed record CreateCreditNoteRequest(decimal Amount, string Reason);
    public sealed record CancelCreditNoteRequest(string Reason);
    public sealed record CreateRefundRequest(decimal Amount, string RefundMethod, string Reason, string? Reference = null, Guid? CreditNoteId = null);
    public sealed record RequestDiscountRequest(string DiscountType, decimal? Percentage, decimal? Amount, string Reason);
    public sealed record CreateInstallmentScheduleRequest(IReadOnlyCollection<InvoiceInstallmentService.InstallmentRequest> Installments);
    public sealed record RecordPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string? Reference);
    public sealed record RecordUnallocatedPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string Currency = "UGX", string? Reference = null);
    public sealed record AllocatePaymentRequest(IReadOnlyCollection<PaymentAllocationRequest> Allocations);
    public sealed record ReverseJournalEntryRequest(string Reason);
}
