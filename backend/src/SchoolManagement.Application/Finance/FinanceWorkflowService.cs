using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceWorkflowService(FinanceService finance)
{
    public async Task<IReadOnlyList<FinanceInvoiceDto>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetStudentInvoicesAsync(studentId, cancellationToken);
        return invoices.Select(FinanceInvoiceDto.FromDomain).ToArray();
    }

    public async Task<FinanceInvoiceDto> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken = default)
    {
        var invoice = await finance.CreateInvoiceAsync(studentId, feeStructureId, invoiceNumber, cancellationToken);
        return FinanceInvoiceDto.FromDomain(invoice);
    }

    public async Task<FinancePaymentDto> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference = null, CancellationToken cancellationToken = default)
    {
        var payment = await finance.RecordPaymentAsync(invoiceId, receiptNumber, amount, paymentMethod, reference, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }
}
