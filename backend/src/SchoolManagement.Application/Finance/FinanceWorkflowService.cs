using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceWorkflowService(FinanceService finance, SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<FeeDto>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetStudentInvoicesAsync(studentId, cancellationToken);
        return invoices.Select(FeeDto.FromDomain).ToArray();
    }

    public async Task<FinanceLedgerEntryDto[]> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetStudentLedgerAsync(studentId, cancellationToken);
        return entries.Select(FinanceLedgerEntryDto.FromDomain).ToArray();
    }

    public async Task<FeeDto> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken = default)
    {
        var invoice = await finance.CreateInvoiceAsync(studentId, feeStructureId, invoiceNumber, cancellationToken);
        return FeeDto.FromDomain(invoice);
    }

    public async Task<FinancePaymentDto> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference = null, CancellationToken cancellationToken = default)
    {
        var payment = await finance.RecordPaymentAsync(invoiceId, receiptNumber, amount, paymentMethod, reference, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }

    public async Task<FinancePaymentDto> RecordUnallocatedPaymentAsync(Guid studentId, string receiptNumber, decimal amount, string paymentMethod, string currency = "UGX", string? reference = null, CancellationToken cancellationToken = default)
    {
        var payment = await finance.RecordUnallocatedPaymentAsync(studentId, receiptNumber, amount, paymentMethod, currency, reference, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }

    public async Task<FinancePaymentDto> AllocatePaymentAsync(Guid paymentId, IReadOnlyCollection<PaymentAllocationRequest> allocations, CancellationToken cancellationToken = default)
    {
        var payment = await finance.AllocatePaymentAsync(paymentId, allocations, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }

    public async Task<FinancePaymentDto> AllocatePaymentFifoAsync(Guid paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await finance.AllocatePaymentFifoAsync(paymentId, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }
}
