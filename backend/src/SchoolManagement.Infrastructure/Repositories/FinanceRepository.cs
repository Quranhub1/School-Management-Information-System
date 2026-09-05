using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class FinanceRepository(SchoolManagementDbContext db) : IFinanceRepository, SchoolManagement.Application.Finance.IFinanceRepository
{
    public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) =>
        db.StudentInvoices.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken);

    public async Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        await db.StudentInvoices.AsNoTracking().Include(x => x.Lines).Where(x => x.StudentId == studentId).OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken cancellationToken) =>
        await db.StudentInvoices.AsNoTracking().Include(x => x.Lines).OrderBy(x => x.StudentId).ThenBy(x => x.IssuedAt).ToListAsync(cancellationToken);

    public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) =>
        db.FeeStructures.AsNoTracking().Include(x => x.Items.OrderBy(i => i.SortOrder)).FirstOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);

    public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) => db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, cancellationToken);
    public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) => db.StudentInvoices.AsNoTracking().AnyAsync(x => x.InvoiceNumber == invoiceNumber, cancellationToken);
    public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) => db.Payments.AsNoTracking().AnyAsync(x => x.ReceiptNumber == receiptNumber, cancellationToken);
    public Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken) => db.JournalEntries.AsNoTracking().AnyAsync(x => x.EntryNumber == entryNumber, cancellationToken);
    public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken) => db.Accounts.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code && x.IsActive, cancellationToken);
    public Task<Account?> GetActiveAccountByIdAsync(Guid accountId, CancellationToken cancellationToken) => db.Accounts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == accountId && x.IsActive, cancellationToken);

    public Task<Payment?> GetPaymentAsync(Guid paymentId, CancellationToken cancellationToken) =>
        db.Payments.Include(x => x.Allocations).FirstOrDefaultAsync(x => x.Id == paymentId, cancellationToken);

    public async Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid studentId, string currency, CancellationToken cancellationToken) =>
        await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Currency == currency && x.PaidAmount < x.Amount)
            .OrderBy(x => x.IssuedAt)
            .ThenBy(x => x.InvoiceNumber)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) =>
        await db.PaymentLedgerEntries.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderBy(x => x.EntryDate)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

    public async Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => await db.StudentInvoices.AddAsync(invoice, cancellationToken);
    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => await db.Payments.AddAsync(payment, cancellationToken);
    public async Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken) => await db.PaymentAllocations.AddAsync(allocation, cancellationToken);
    public async Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken) => await db.PaymentLedgerEntries.AddAsync(entry, cancellationToken);
    public async Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken) => await db.JournalEntries.AddAsync(journalEntry, cancellationToken);
    public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid journalEntryId, CancellationToken cancellationToken) => db.JournalEntries.AsNoTracking().Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == journalEntryId && x.Status == "Posted", cancellationToken);
    public Task<bool> HasReversalAsync(Guid journalEntryId, CancellationToken cancellationToken) => db.JournalEntries.AsNoTracking().AnyAsync(x => x.ReversalOfJournalEntryId == journalEntryId, cancellationToken);

    public async Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken)
    {
        var query = db.JournalEntries.AsNoTracking().Include(x => x.Lines).ThenInclude(x => x.Account).Where(x => x.Status == "Posted");
        if (from.HasValue) query = query.Where(x => x.EntryDate.Date >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) query = query.Where(x => x.EntryDate.Date <= to.Value.ToDateTime(TimeOnly.MaxValue));
        if (accountId.HasValue) query = query.Where(x => x.Lines.Any(l => l.AccountId == accountId.Value));
        return await query.OrderBy(x => x.EntryDate).ThenBy(x => x.EntryNumber).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.Payments.AsNoTracking().Include(p => p.Allocations).AsQueryable();
        if (!string.IsNullOrWhiteSpace(receiptNumber)) query = query.Where(p => p.ReceiptNumber.Contains(receiptNumber.Trim()));
        if (!string.IsNullOrWhiteSpace(paymentMethod)) query = query.Where(p => p.PaymentMethod == paymentMethod.Trim());
        if (from.HasValue) query = query.Where(p => p.PaidAt.Date >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) query = query.Where(p => p.PaidAt.Date <= to.Value.ToDateTime(TimeOnly.MaxValue));
        return await query.OrderByDescending(p => p.PaidAt).ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
