using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceAdjustmentsRepository
{
    Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken);
    Task<bool> CreditNoteNumberExistsAsync(string creditNoteNumber, CancellationToken cancellationToken);
    Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken);
    Task<Refund?> GetRefundAsync(Guid refundId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Refund>> GetRefundsAsync(Guid paymentId, CancellationToken cancellationToken);
    Task<bool> RefundNumberExistsAsync(string refundNumber, CancellationToken cancellationToken);
    Task<decimal> GetRefundedAmountAsync(Guid paymentId, CancellationToken cancellationToken);
    Task AddRefundAsync(Refund refund, CancellationToken cancellationToken);
}
