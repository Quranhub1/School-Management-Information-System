using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FeeWorkflowService(FeeService feeService)
{
    public Task<StudentInvoice> CreateInvoiceAsync(Guid studentId, Guid? feeStructureId, string invoiceNumber, decimal amount, string currency = "UGX", CancellationToken cancellationToken = default) =>
        feeService.CreateInvoiceAsync(studentId, feeStructureId, invoiceNumber, amount, currency, cancellationToken);

    public Task<Payment> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference = null, CancellationToken cancellationToken = default) =>
        feeService.RecordPaymentAsync(invoiceId, receiptNumber, amount, paymentMethod, reference, cancellationToken);
}
