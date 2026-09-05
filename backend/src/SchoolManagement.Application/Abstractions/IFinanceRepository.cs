using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceRepository
{
    Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken cancellationToken);
    Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken);
    Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken);
    Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken);
    Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken);
    Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken);
    Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken);
    Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken);
    Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken);
    Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
