using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceController(FinanceWorkflowService finance, FinanceReportService reports, JournalReversalService reversals) : ControllerBase
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

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        try { var invoice = await finance.CreateInvoiceAsync(request.StudentId, request.FeeStructureId, request.InvoiceNumber, cancellationToken); return Created($"/api/finance/invoices/{invoice.Id}", invoice); }
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
    public sealed record RecordPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string? Reference);
    public sealed record RecordUnallocatedPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string Currency = "UGX", string? Reference = null);
    public sealed record AllocatePaymentRequest(IReadOnlyCollection<PaymentAllocationRequest> Allocations);
    public sealed record ReverseJournalEntryRequest(string Reason);
}
