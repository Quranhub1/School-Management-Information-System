using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceAdjustmentsRepository
{
    Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken);
    Task<CreditNote?> GetCreditNoteForUpdateAsync(Guid creditNoteId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken);
    Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken);
}
