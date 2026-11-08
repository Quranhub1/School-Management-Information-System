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
    Task<Payment?> GetPaymentAsync(Guid paymentId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid studentId, string currency, CancellationToken cancellationToken);
    Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken);
    Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken);
    Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken);
    Task<Account?> GetActiveAccountByIdAsync(Guid accountId, CancellationToken cancellationToken);
    Task<JournalEntry?> GetPostedJournalEntryAsync(Guid journalEntryId, CancellationToken cancellationToken);
    Task<bool> HasReversalAsync(Guid journalEntryId, CancellationToken cancellationToken);
    Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid discountId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid studentId, CancellationToken cancellationToken);
    Task<StudentCharge?> GetStudentChargeAsync(Guid chargeId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken cancellationToken);
    Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken);
    Task AddInvoiceInstallmentAsync(InvoiceInstallment installment, CancellationToken cancellationToken);
    Task AddStudentChargeAsync(StudentCharge charge, CancellationToken cancellationToken);
    Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken);
    Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken);
    Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken);
    Task AddInvoiceDiscountAsync(InvoiceDiscount discount, CancellationToken cancellationToken);
    Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken);
    Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken);
    Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
