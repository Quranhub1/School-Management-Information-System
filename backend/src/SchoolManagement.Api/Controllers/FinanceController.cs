using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetInvoices([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        var query = db.StudentInvoices.AsNoTracking();
        if (studentId.HasValue) query = query.Where(x => x.StudentId == studentId.Value);
        var invoices = await query.OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
        return Ok(invoices.Select(ToResponse));
    }

    [HttpPost("invoices")]
    public async Task<ActionResult<InvoiceResponse>> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        if (request.StudentId == Guid.Empty || request.Amount <= 0 || string.IsNullOrWhiteSpace(request.InvoiceNumber))
            return BadRequest("StudentId, a positive Amount and InvoiceNumber are required.");
        if (await db.StudentInvoices.AnyAsync(x => x.InvoiceNumber == request.InvoiceNumber.Trim(), cancellationToken))
            return Conflict("Invoice number already exists.");
        if (!await db.Students.AnyAsync(x => x.Id == request.StudentId, cancellationToken))
            return BadRequest("Student does not exist.");

        var invoice = new StudentInvoice
        {
            StudentId = request.StudentId,
            FeeStructureId = request.FeeStructureId,
            InvoiceNumber = request.InvoiceNumber.Trim(),
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "UGX" : request.Currency.Trim().ToUpperInvariant(),
            Status = "Unpaid"
        };
        db.StudentInvoices.Add(invoice);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/finance/invoices/{invoice.Id}", ToResponse(invoice));
    }

    [HttpPost("invoices/{invoiceId:guid}/payments")]
    public async Task<ActionResult<PaymentResponse>> RecordPayment(Guid invoiceId, RecordPaymentRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0 || string.IsNullOrWhiteSpace(request.ReceiptNumber) || string.IsNullOrWhiteSpace(request.PaymentMethod))
            return BadRequest("Amount, ReceiptNumber and PaymentMethod are required.");

        var invoice = await db.StudentInvoices.FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken);
        if (invoice is null) return NotFound("Invoice not found.");
        var balance = invoice.Amount - invoice.PaidAmount;
        if (request.Amount > balance) return BadRequest("Payment cannot exceed the outstanding invoice balance.");
        if (await db.Payments.AnyAsync(x => x.ReceiptNumber == request.ReceiptNumber.Trim(), cancellationToken))
            return Conflict("Receipt number already exists.");

        var payment = new Payment
        {
            StudentInvoiceId = invoiceId,
            ReceiptNumber = request.ReceiptNumber.Trim(),
            Amount = request.Amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? invoice.Currency : request.Currency.Trim().ToUpperInvariant(),
            PaymentMethod = request.PaymentMethod.Trim(),
            Reference = string.IsNullOrWhiteSpace(request.Reference) ? null : request.Reference.Trim()
        };
        invoice.PaidAmount += payment.Amount;
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : "Partially Paid";
        db.Payments.Add(payment);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new PaymentResponse(payment.Id, payment.ReceiptNumber, payment.Amount, payment.Currency, payment.PaymentMethod, invoice.PaidAmount, invoice.Amount - invoice.PaidAmount));
    }

    private static InvoiceResponse ToResponse(StudentInvoice x) => new(x.Id, x.StudentId, x.InvoiceNumber, x.Amount, x.PaidAmount, x.Amount - x.PaidAmount, x.Currency, x.Status, x.IssuedAt);

    public sealed record CreateInvoiceRequest(Guid StudentId, Guid? FeeStructureId, string InvoiceNumber, decimal Amount, string? Currency);
    public sealed record RecordPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string? Reference, string? Currency);
    public sealed record InvoiceResponse(Guid Id, Guid StudentId, string InvoiceNumber, decimal Amount, decimal PaidAmount, decimal Balance, string Currency, string Status, DateTimeOffset IssuedAt);
    public sealed record PaymentResponse(Guid Id, string ReceiptNumber, decimal Amount, string Currency, string PaymentMethod, decimal InvoicePaidAmount, decimal InvoiceBalance);
}
