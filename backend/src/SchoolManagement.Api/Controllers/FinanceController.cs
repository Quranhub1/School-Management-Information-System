using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceController(FinanceWorkflowService finance) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        if (!studentId.HasValue || studentId.Value == Guid.Empty)
            return BadRequest(new { message = "studentId is required." });

        return Ok(await finance.GetStudentInvoicesAsync(studentId.Value, cancellationToken));
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var invoice = await finance.CreateInvoiceAsync(
                request.StudentId,
                request.FeeStructureId,
                request.InvoiceNumber,
                cancellationToken);

            return Created($"/api/finance/invoices/{invoice.Id}", invoice);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("invoices/{invoiceId:guid}/payments")]
    public async Task<IActionResult> RecordPayment(
        Guid invoiceId,
        RecordPaymentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var payment = await finance.RecordPaymentAsync(
                invoiceId,
                request.ReceiptNumber,
                request.Amount,
                request.PaymentMethod,
                request.Reference,
                cancellationToken);

            return Ok(payment);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    public sealed record CreateInvoiceRequest(
        Guid StudentId,
        Guid FeeStructureId,
        string InvoiceNumber);

    public sealed record RecordPaymentRequest(
        decimal Amount,
        string ReceiptNumber,
        string PaymentMethod,
        string? Reference);
}
