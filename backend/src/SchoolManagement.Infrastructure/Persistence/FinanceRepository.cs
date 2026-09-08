using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class FinanceRepository(SchoolManagementDbContext db) : IFinanceRepository
{
    // These aggregate roots are returned tracked because application workflows
    // intentionally mutate them before SaveChangesAsync (payments, discounts,
    // charges, installments and invoice balances).
    public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => db.StudentInvoices.SingleOrDefaultAsync(x => x.Id == invoiceId, cancellationToken);
    public async Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) => await db.StudentInvoices.AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken cancellationToken) => await db.StudentInvoices.AsNoTracking().OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
    public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) => db.FeeStructures.AsNoTracking().SingleOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);
    public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) => db.Students.AnyAsync(x => x.Id == studentId, cancellationToken);
    public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) => db.StudentInvoices.AnyAsync(x => x.InvoiceNumber == invoiceNumber, cancellationToken);
    public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) => db.Payments.AnyAsync(x => x.ReceiptNumber == receiptNumber, cancellationToken);
    public Task<Payment?> GetPaymentAsync(Guid paymentId, CancellationToken cancellationToken) => db.Payments.AsNoTracking().SingleOrDefaultAsync(x => x.Id == paymentId, cancellationToken);
    public async Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid studentId, string currency, CancellationToken cancellationToken) => await db.StudentInvoices.AsNoTracking().Where(x => x.StudentId == studentId && x.Currency == currency && x.Amount - x.DiscountAmount - x.PaidAmount > 0).OrderBy(x => x.IssuedAt).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) => await db.PaymentLedgerEntries.AsNoTracking().Where(x => x.StudentId == studentId).OrderBy(x => x.EntryDate).ToListAsync(cancellationToken);
    public Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken) => db.JournalEntries.AnyAsync(x => x.EntryNumber == entryNumber, cancellationToken);
    public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken) => db.Accounts.AsNoTracking().SingleOrDefaultAsync(x => x.Code == code && x.IsActive, cancellationToken);
    public Task<Account?> GetActiveAccountByIdAsync(Guid accountId, CancellationToken cancellationToken) => db.Accounts.AsNoTracking().SingleOrDefaultAsync(x => x.Id == accountId && x.IsActive, cancellationToken);
    public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid journalEntryId, CancellationToken cancellationToken) => db.JournalEntries.AsNoTracking().Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == journalEntryId && x.Status == "Posted", cancellationToken);
    public Task<bool> HasReversalAsync(Guid journalEntryId, CancellationToken cancellationToken) => db.JournalEntries.AnyAsync(x => x.ReversalOfJournalEntryId == journalEntryId, cancellationToken);
    public Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid discountId, CancellationToken cancellationToken) => db.Set<InvoiceDiscount>().SingleOrDefaultAsync(x => x.Id == discountId, cancellationToken);
    public async Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid invoiceId, CancellationToken cancellationToken) => await db.Set<InvoiceDiscount>().AsNoTracking().Where(x => x.StudentInvoiceId == invoiceId).OrderBy(x => x.RequestedAt).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid invoiceId, CancellationToken cancellationToken) => await db.Set<InvoiceInstallment>().AsNoTracking().Where(x => x.StudentInvoiceId == invoiceId).OrderBy(x => x.Sequence).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid studentId, CancellationToken cancellationToken) => await db.Set<StudentCharge>().AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
    public Task<StudentCharge?> GetStudentChargeAsync(Guid chargeId, CancellationToken cancellationToken) => db.Set<StudentCharge>().SingleOrDefaultAsync(x => x.Id == chargeId, cancellationToken);
    public async Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken) => await db.CreditNotes.AsNoTracking().Where(x => x.StudentInvoiceId == studentInvoiceId).OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
    public async Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken cancellationToken) => await db.CreditNotes.AsNoTracking().OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
    public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken) => db.CreditNotes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == creditNoteId, cancellationToken);
    public Task<CreditNote?> GetCreditNoteForUpdateAsync(Guid creditNoteId, CancellationToken cancellationToken) => db.CreditNotes.SingleOrDefaultAsync(x => x.Id == creditNoteId, cancellationToken);
    public async Task AddInvoiceInstallmentAsync(InvoiceInstallment installment, CancellationToken cancellationToken) => await db.Set<InvoiceInstallment>().AddAsync(installment, cancellationToken);
    public async Task AddStudentChargeAsync(StudentCharge charge, CancellationToken cancellationToken) => await db.Set<StudentCharge>().AddAsync(charge, cancellationToken);
    public async Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => await db.StudentInvoices.AddAsync(invoice, cancellationToken);
    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => await db.Payments.AddAsync(payment, cancellationToken);
    public async Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken) => await db.PaymentAllocations.AddAsync(allocation, cancellationToken);
    public async Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken) => await db.PaymentLedgerEntries.AddAsync(entry, cancellationToken);
    public async Task AddInvoiceDiscountAsync(InvoiceDiscount discount, CancellationToken cancellationToken) => await db.Set<InvoiceDiscount>().AddAsync(discount, cancellationToken);
    public async Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken) => await db.CreditNotes.AddAsync(creditNote, cancellationToken);
    public async Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken) => await db.JournalEntries.AddAsync(journalEntry, cancellationToken);
    public async Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken)
    {
        var query = db.JournalEntries.AsNoTracking().Where(x => x.Status == "Posted");
        if (from.HasValue) query = query.Where(x => DateOnly.FromDateTime(x.EntryDate.UtcDateTime) >= from.Value);
        if (to.HasValue) query = query.Where(x => DateOnly.FromDateTime(x.EntryDate.UtcDateTime) <= to.Value);
        if (accountId.HasValue) query = query.Where(x => x.Lines.Any(l => l.AccountId == accountId.Value));
        return await query.Include(x => x.Lines).OrderBy(x => x.EntryDate).ToListAsync(cancellationToken);
    }
    public async Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.Payments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(receiptNumber)) query = query.Where(x => x.ReceiptNumber == receiptNumber);
        if (!string.IsNullOrWhiteSpace(paymentMethod)) query = query.Where(x => x.PaymentMethod == paymentMethod);
        if (from.HasValue) query = query.Where(x => DateOnly.FromDateTime(x.PaidAt.UtcDateTime) >= from.Value);
        if (to.HasValue) query = query.Where(x => DateOnly.FromDateTime(x.PaidAt.UtcDateTime) <= to.Value);
        return await query.OrderByDescending(x => x.PaidAt).ToListAsync(cancellationToken);
    }
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
