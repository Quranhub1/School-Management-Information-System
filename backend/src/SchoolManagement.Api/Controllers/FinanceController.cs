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
                request.FeeType,
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

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        return Ok(await finance.GetDashboardAsync(cancellationToken));
    }

    [HttpGet("outstanding")]
    public async Task<IActionResult> GetOutstandingBalances([FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetOutstandingBalancesAsync(programmeId, cancellationToken));
    }

    [HttpGet("fee-structures")]
    public async Task<IActionResult> GetFeeStructures([FromQuery] Guid? academicYearId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetFeeStructuresAsync(academicYearId, cancellationToken));
    }

    [HttpPost("fee-structures")]
    public async Task<IActionResult> CreateFeeStructure(CreateFeeStructureRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var feeStructure = await finance.CreateFeeStructureAsync(
                request.ProgrammeId,
                request.AcademicYearId,
                request.Name,
                request.TotalAmount,
                request.Currency,
                request.FeeType,
                cancellationToken);

            return Ok(feeStructure);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("mobile-money")]
    public async Task<IActionResult> CreateMobileMoneyTransaction(CreateMobileMoneyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var transaction = await finance.CreateMobileMoneyTransactionAsync(
                request.StudentId,
                request.StudentInvoiceId,
                request.Provider,
                request.PhoneNumber,
                request.Amount,
                cancellationToken);

            return Ok(transaction);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("mobile-money/{transactionId:guid}/confirm")]
    public async Task<IActionResult> ConfirmMobileMoneyTransaction(Guid transactionId, ConfirmMobileMoneyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await finance.ConfirmMobileMoneyTransactionAsync(transactionId, request.ExternalRef, cancellationToken);
            return Ok(new { message = "Transaction confirmed." });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("mobile-money")]
    public async Task<IActionResult> GetMobileMoneyTransactions([FromQuery] string? status, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetMobileMoneyTransactionsAsync(status, cancellationToken));
    }

    [HttpPost("bulk-payments")]
    public async Task<IActionResult> CreateBulkPayment(CreateBulkPaymentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = new List<object>();
            foreach (var item in request.Payments)
            {
                try
                {
                    var payment = await finance.RecordPaymentAsync(
                        item.InvoiceId,
                        item.ReceiptNumber,
                        item.Amount,
                        item.PaymentMethod,
                        item.Reference,
                        cancellationToken);

                    result.Add(new { studentId = item.StudentId, invoiceId = item.InvoiceId, success = true, payment });
                }
                catch (Exception ex)
                {
                    result.Add(new { studentId = item.StudentId, invoiceId = item.InvoiceId, success = false, error = ex.Message });
                }
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("daily-collections")]
    public async Task<IActionResult> CreateDailyCollection(CreateDailyCollectionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await finance.CreateDailyCollectionAsync(
                request.CashierName,
                request.CashierUserId,
                request.CollectionDate,
                cancellationToken);

            return Ok(collection);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("daily-collections/{collectionId:guid}/payments")]
    public async Task<IActionResult> AddPaymentToDailyCollection(Guid collectionId, AddDailyCollectionPaymentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await finance.AddPaymentToDailyCollectionAsync(
                collectionId,
                request.StudentInvoiceId,
                request.StudentId,
                request.Amount,
                request.PaymentMethod,
                request.ReceiptNumber,
                request.Reference,
                cancellationToken);

            return Ok(new { message = "Payment added to daily collection." });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("daily-collections/{collectionId:guid}/close")]
    public async Task<IActionResult> CloseDailyCollection(Guid collectionId, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await finance.CloseDailyCollectionAsync(collectionId, cancellationToken);
            return Ok(collection);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("daily-collections")]
    public async Task<IActionResult> GetDailyCollections([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetDailyCollectionsAsync(from, to, cancellationToken));
    }

    [HttpPost("sponsorships")]
    public async Task<IActionResult> CreateSponsorship(CreateSponsorshipRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var sponsorship = await finance.CreateSponsorshipAsync(
                request.StudentId,
                request.SponsorName,
                request.Amount,
                request.Type,
                request.StartDate,
                request.EndDate,
                request.Notes,
                cancellationToken);

            return Ok(sponsorship);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("sponsorships")]
    public async Task<IActionResult> GetSponsorships([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetSponsorshipsAsync(studentId, cancellationToken));
    }

    [HttpPost("instalment-plans")]
    public async Task<IActionResult> CreateInstalmentPlan(CreateInstalmentPlanRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var plan = await finance.CreateInstalmentPlanAsync(
                request.StudentInvoiceId,
                request.StudentId,
                request.NumberOfInstalments,
                cancellationToken);

            return Ok(plan);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("instalment-plans")]
    public async Task<IActionResult> GetInstalmentPlans([FromQuery] Guid studentId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetInstalmentPlansAsync(studentId, cancellationToken));
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] string? receiptNumber,
        [FromQuery] string? paymentMethod,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        return Ok(await finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken));
    }

    [HttpPost("credit-notes")]
    public async Task<IActionResult> IssueCreditNote(IssueCreditNoteRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var creditNote = await finance.IssueCreditNoteAsync(
                request.StudentInvoiceId,
                request.CreditNoteNumber,
                request.Amount,
                request.Reason,
                request.IssuedBy,
                cancellationToken);

            return Ok(creditNote);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("credit-notes")]
    public async Task<IActionResult> GetCreditNotes([FromQuery] Guid? studentInvoiceId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetCreditNotesAsync(studentInvoiceId, cancellationToken));
    }

    [HttpPost("invoices/{invoiceId:guid}/notes")]
    public async Task<IActionResult> AddInvoiceNote(Guid invoiceId, AddInvoiceNoteRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var note = await finance.AddInvoiceNoteAsync(invoiceId, request.Note, request.CreatedBy, cancellationToken);
            return Ok(note);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("invoices/{invoiceId:guid}/notes")]
    public async Task<IActionResult> GetInvoiceNotes(Guid invoiceId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetInvoiceNotesAsync(invoiceId, cancellationToken));
    }

    [HttpPost("staff-advances")]
    public async Task<IActionResult> RequestStaffAdvance(RequestStaffAdvanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var advance = await finance.RequestStaffAdvanceAsync(
                request.StaffMemberId,
                request.Amount,
                request.Reason,
                request.Currency,
                cancellationToken);

            return Ok(advance);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("staff-advances/{advanceId:guid}/approve")]
    public async Task<IActionResult> ApproveStaffAdvance(Guid advanceId, ApproveStaffAdvanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var advance = await finance.ApproveStaffAdvanceAsync(advanceId, request.ApprovedBy, cancellationToken);
            return Ok(advance);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("staff-advances/{advanceId:guid}/recover")]
    public async Task<IActionResult> RecoverStaffAdvance(Guid advanceId, RecoverStaffAdvanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var advance = await finance.RecoverStaffAdvanceAsync(advanceId, request.RecoveredFromPayrollId, cancellationToken);
            return Ok(advance);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("staff-advances")]
    public async Task<IActionResult> GetStaffAdvances([FromQuery] Guid? staffMemberId, CancellationToken cancellationToken)
    {
        return Ok(await finance.GetStaffAdvancesAsync(staffMemberId, cancellationToken));
    }

    public sealed record CreateInvoiceRequest(
        Guid StudentId,
        Guid FeeStructureId,
        string InvoiceNumber,
        string FeeType);

    public sealed record RecordPaymentRequest(
        decimal Amount,
        string ReceiptNumber,
        string PaymentMethod,
        string? Reference);

    public sealed record CreateFeeStructureRequest(
        Guid ProgrammeId,
        Guid AcademicYearId,
        string Name,
        decimal TotalAmount,
        string? Currency,
        string? FeeType);

    public sealed record CreateMobileMoneyRequest(
        Guid StudentId,
        Guid? StudentInvoiceId,
        string Provider,
        string PhoneNumber,
        decimal Amount);

    public sealed record ConfirmMobileMoneyRequest(string ExternalRef);

    public sealed record CreateBulkPaymentRequest(List<BulkPaymentItem> Payments);

    public sealed record BulkPaymentItem(
        Guid StudentId,
        Guid InvoiceId,
        decimal Amount,
        string ReceiptNumber,
        string PaymentMethod,
        string? Reference);

    public sealed record CreateDailyCollectionRequest(
        string CashierName,
        Guid? CashierUserId,
        DateOnly CollectionDate);

    public sealed record AddDailyCollectionPaymentRequest(
        Guid StudentInvoiceId,
        Guid StudentId,
        decimal Amount,
        string PaymentMethod,
        string? ReceiptNumber,
        string? Reference);

    public sealed record CreateSponsorshipRequest(
        Guid StudentId,
        string SponsorName,
        decimal Amount,
        string Type,
        DateOnly? StartDate,
        DateOnly? EndDate,
        string? Notes);

    public sealed record CreateInstalmentPlanRequest(
        Guid StudentInvoiceId,
        Guid StudentId,
        int NumberOfInstalments);

    public sealed record IssueCreditNoteRequest(
        Guid StudentInvoiceId,
        string CreditNoteNumber,
        decimal Amount,
        string Reason,
        string? IssuedBy);

    public sealed record AddInvoiceNoteRequest(
        string Note,
        string? CreatedBy);

    public sealed record RequestStaffAdvanceRequest(
        Guid StaffMemberId,
        decimal Amount,
        string Reason,
        string? Currency);

    public sealed record ApproveStaffAdvanceRequest(
        string ApprovedBy);

    public sealed record RecoverStaffAdvanceRequest(
        Guid RecoveredFromPayrollId);
}
