using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceController(FinanceWorkflowService finance, InvoiceDiscountService discounts, InvoiceInstallmentService installments, StudentChargeService charges, CreditNoteRefundService adjustments, FinanceReportService reports, ReceivablesReportService receivables, JournalReversalService reversals) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        if (!studentId.HasValue || studentId.Value == Guid.Empty) return BadRequest(new { message = "studentId is required." });
        return Ok(await finance.GetStudentInvoicesAsync(studentId.Value, cancellationToken));
    }

    [HttpGet("students/{studentId:guid}/ledger")]
    public async Task<IActionResult> GetStudentLedger(Guid studentId, CancellationToken cancellationToken) =>
        Ok(await finance.GetStudentLedgerAsync(studentId, cancellationToken));

    [HttpGet("reports/receivables-ageing")]
    public async Task<IActionResult> ReceivablesAgeing([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default)
    {
        try { return Ok(await receivables.GetAgeingAsync(asOf, currency, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("reports/receivables-reconciliation")]
    public async Task<IActionResult> ReceivablesReconciliation([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default)
    {
        try { return Ok(await receivables.GetReconciliationAsync(asOf, currency, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("students/{studentId:guid}/charges")]
    public async Task<IActionResult> GetStudentCharges(Guid studentId, CancellationToken cancellationToken)
    {
        try { return Ok(await charges.GetStudentChargesAsync(studentId, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("students/{studentId:guid}/charges")]
    public async Task<IActionResult> CreateStudentCharge(Guid studentId, CreateStudentChargeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var createdBy = User.Identity?.Name;
            var charge = await charges.CreateAsync(studentId, request.ChargeType, request.Description, request.Amount, request.Currency, createdBy, cancellationToken);
            return Created($"/api/finance/students/{studentId}/charges/{charge.Id}", charge);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("charges/{chargeId:guid}/void")]
    public async Task<IActionResult> VoidStudentCharge(Guid chargeId, VoidStudentChargeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var performedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(performedBy)) return Unauthorized(new { message = "Authenticated user identity is required for a charge void." });
            return Ok(await charges.VoidAsync(chargeId, request.Reason, performedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("invoices/{invoiceId:guid}/credit-notes")]
    public async Task<IActionResult> GetCreditNotes(Guid invoiceId, CancellationToken cancellationToken) =>
        Ok(await adjustments.GetCreditNotesAsync(invoiceId, cancellationToken));

    [HttpPost("invoices/{invoiceId:guid}/credit-notes")]
    public async Task<IActionResult> CreateCreditNote(Guid invoiceId, CreateCreditNoteRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var issuedBy = User.Identity?.Name;
            var creditNote = await adjustments.CreateCreditNoteAsync(invoiceId, request.Amount, request.Reason, issuedBy, cancellationToken);
            return Created($"/api/finance/invoices/{invoiceId}/credit-notes/{creditNote.Id}", creditNote);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("payments/{paymentId:guid}/refund")]
    public async Task<IActionResult> RefundPayment(Guid paymentId, CreateRefundRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var refundedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(refundedBy)) return Unauthorized(new { message = "Authenticated user identity is required for a refund." });
            return Ok(await adjustments.CreateRefundAsync(paymentId, request.Amount, request.RefundMethod, request.Reason, request.Reference, refundedBy, request.CreditNoteId, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        try { var invoice = await finance.CreateInvoiceAsync(request.StudentId, request.FeeStructureId, request.InvoiceNumber, cancellationToken); return Created($"/api/finance/invoices/{invoice.Id}", invoice); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("invoices/{invoiceId:guid}/discounts")]
    public async Task<IActionResult> GetDiscounts(Guid invoiceId, CancellationToken cancellationToken) =>
        Ok(await discounts.GetAsync(invoiceId, cancellationToken));

    [HttpPost("invoices/{invoiceId:guid}/discounts")]
    public async Task<IActionResult> RequestDiscount(Guid invoiceId, RequestDiscountRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var requestedBy = User.Identity?.Name;
            return Ok(await discounts.RequestAsync(invoiceId, request.DiscountType, request.Percentage, request.Amount, request.Reason, requestedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("discounts/{discountId:guid}/approve")]
    public async Task<IActionResult> ApproveDiscount(Guid discountId, CancellationToken cancellationToken)
    {
        try
        {
            var approvedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(approvedBy)) return Unauthorized(new { message = "Authenticated user identity is required for approval." });
            return Ok(await discounts.ApproveAsync(discountId, approvedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("discounts/{discountId:guid}/reject")]
    public async Task<IActionResult> RejectDiscount(Guid discountId, CancellationToken cancellationToken)
    {
        try
        {
            var rejectedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(rejectedBy)) return Unauthorized(new { message = "Authenticated user identity is required for rejection." });
            return Ok(await discounts.RejectAsync(discountId, rejectedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("invoices/{invoiceId:guid}/installments")]
    public async Task<IActionResult> GetInstallments(Guid invoiceId, CancellationToken cancellationToken) =>
        Ok(await installments.GetAsync(invoiceId, cancellationToken));

    [HttpGet("invoices/{invoiceId:guid}/installments/overdue")]
    public async Task<IActionResult> GetOverdueInstallments(Guid invoiceId, [FromQuery] DateOnly? asOf, CancellationToken cancellationToken) =>
        Ok(await installments.GetOverdueAsync(invoiceId, asOf ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));

    [HttpPost("invoices/{invoiceId:guid}/installments")]
    public async Task<IActionResult> CreateInstallmentSchedule(Guid invoiceId, CreateInstallmentScheduleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await installments.CreateScheduleAsync(invoiceId, request.Installments, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("invoices/{invoiceId:guid}/payments")]
    public async Task<IActionResult> RecordPayment(Guid invoiceId, RecordPaymentRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.RecordPaymentAsync(invoiceId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Reference, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("students/{studentId:guid}/payments")]
    public async Task<IActionResult> RecordUnallocatedPayment(Guid studentId, RecordUnallocatedPaymentRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.RecordUnallocatedPaymentAsync(studentId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Currency, request.Reference, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("payments/{paymentId:guid}/allocate")]
    public async Task<IActionResult> AllocatePayment(Guid paymentId, AllocatePaymentRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.AllocatePaymentAsync(paymentId, request.Allocations, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("payments/{paymentId:guid}/allocate-fifo")]
    public async Task<IActionResult> AllocatePaymentFifo(Guid paymentId, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.AllocatePaymentFifoAsync(paymentId, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("journal-entries/{journalEntryId:guid}/reverse")]
    public async Task<IActionResult> ReverseJournalEntry(Guid journalEntryId, ReverseJournalEntryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var performedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(performedBy)) return Unauthorized(new { message = "Authenticated user identity is required for a reversal." });
            return Ok(await reversals.ReverseAsync(journalEntryId, request.Reason, performedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("reports/general-ledger")]
    public async Task<IActionResult> GeneralLedger([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? accountId, CancellationToken cancellationToken) =>
        Ok(await reports.GetGeneralLedgerAsync(from, to, accountId, cancellationToken));

    [HttpGet("reports/trial-balance")]
    public async Task<IActionResult> TrialBalance([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken) =>
        Ok(await reports.GetTrialBalanceAsync(from, to, cancellationToken));

    [HttpGet("reports/student-receivables")]
    public async Task<IActionResult> StudentReceivables(CancellationToken cancellationToken) =>
        Ok(await reports.GetStudentReceivablesAsync(cancellationToken));

    public sealed record CreateInvoiceRequest(Guid StudentId, Guid FeeStructureId, string InvoiceNumber);
    public sealed record CreateStudentChargeRequest(string ChargeType, string Description, decimal Amount, string Currency = "UGX");
    public sealed record VoidStudentChargeRequest(string Reason);
    public sealed record CreateCreditNoteRequest(decimal Amount, string Reason);
    public sealed record CreateRefundRequest(decimal Amount, string RefundMethod, string Reason, string? Reference = null, Guid? CreditNoteId = null);
    public sealed record RequestDiscountRequest(string DiscountType, decimal? Percentage, decimal? Amount, string Reason);
    public sealed record CreateInstallmentScheduleRequest(IReadOnlyCollection<InvoiceInstallmentService.InstallmentRequest> Installments);
    public sealed record RecordPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string? Reference);
    public sealed record RecordUnallocatedPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string Currency = "UGX", string? Reference = null);
    public sealed record AllocatePaymentRequest(IReadOnlyCollection<PaymentAllocationRequest> Allocations);
    public sealed record ReverseJournalEntryRequest(string Reason);
}
