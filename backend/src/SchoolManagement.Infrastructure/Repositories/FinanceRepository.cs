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

    public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) =>
        db.FeeStructures.AsNoTracking().Include(x => x.Items.OrderBy(i => i.SortOrder)).FirstOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);

    public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) => db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, cancellationToken);
    public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) => db.StudentInvoices.AsNoTracking().AnyAsync(x => x.InvoiceNumber == invoiceNumber, cancellationToken);
    public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) => db.Payments.AsNoTracking().AnyAsync(x => x.ReceiptNumber == receiptNumber, cancellationToken);
    public async Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => await db.StudentInvoices.AddAsync(invoice, cancellationToken);
    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => await db.Payments.AddAsync(payment, cancellationToken);

    public async Task PostInvoiceAccountingAsync(StudentInvoice invoice, CancellationToken cancellationToken)
    {
        var entryNumber = $"INV-{invoice.InvoiceNumber}";
        if (await db.JournalEntries.AnyAsync(x => x.EntryNumber == entryNumber, cancellationToken)) return;
        var receivable = await GetOrCreateAccountAsync("1100", "Student Receivables", "Asset", cancellationToken);
        var lines = invoice.Lines.Where(x => x.Amount > 0).ToList();
        var entry = new JournalEntry { EntryNumber = entryNumber, Description = $"Student invoice {invoice.InvoiceNumber}" };
        entry.Lines.Add(new JournalEntryLine { JournalEntryId = entry.Id, AccountId = receivable.Id, Description = $"Receivable - {invoice.InvoiceNumber}", Debit = invoice.Amount });
        if (lines.Count == 0)
        {
            var income = await GetOrCreateAccountAsync("4100", "Tuition and Student Fees", "Income", cancellationToken);
            entry.Lines.Add(new JournalEntryLine { JournalEntryId = entry.Id, AccountId = income.Id, Description = "Student fees", Credit = invoice.Amount });
        }
        else
        {
            foreach (var group in lines.GroupBy(x => x.IncomeAccountId))
            {
                var income = group.Key.HasValue ? await db.Accounts.FirstOrDefaultAsync(x => x.Id == group.Key.Value && x.IsActive, cancellationToken) : null;
                income ??= await GetOrCreateAccountAsync("4100", "Tuition and Student Fees", "Income", cancellationToken);
                entry.Lines.Add(new JournalEntryLine { JournalEntryId = entry.Id, AccountId = income.Id, Description = $"Income - {invoice.InvoiceNumber}", Credit = group.Sum(x => x.Amount) });
            }
        }
        entry.Post("system:finance");
        await db.JournalEntries.AddAsync(entry, cancellationToken);
    }

    public async Task PostPaymentAccountingAsync(Payment payment, string postedBy, CancellationToken cancellationToken)
    {
        var entryNumber = $"RCPT-{payment.ReceiptNumber}";
        if (await db.JournalEntries.AnyAsync(x => x.EntryNumber == entryNumber, cancellationToken)) return;
        var receivable = await GetOrCreateAccountAsync("1100", "Student Receivables", "Asset", cancellationToken);
        var method = payment.PaymentMethod.Trim().ToLowerInvariant();
        var (code, name) = method switch
        {
            "cash" => ("1000", "Cash on Hand"),
            "bank" or "bank transfer" => ("1010", "Bank Account"),
            "mobile money" or "mobilemoney" or "momo" => ("1020", "Mobile Money"),
            "card" => ("1030", "Card Receipts"),
            _ => ("1090", "Other Payment Receipts")
        };
        var cash = await GetOrCreateAccountAsync(code, name, "Asset", cancellationToken);
        var entry = new JournalEntry { EntryNumber = entryNumber, Description = $"Payment receipt {payment.ReceiptNumber}" };
        entry.Lines.Add(new JournalEntryLine { JournalEntryId = entry.Id, AccountId = cash.Id, Description = $"Receipt {payment.ReceiptNumber}", Debit = payment.Amount });
        entry.Lines.Add(new JournalEntryLine { JournalEntryId = entry.Id, AccountId = receivable.Id, Description = "Student receivable settlement", Credit = payment.Amount });
        entry.Post(postedBy);
        await db.JournalEntries.AddAsync(entry, cancellationToken);
    }

    private async Task<Account> GetOrCreateAccountAsync(string code, string name, string type, CancellationToken cancellationToken)
    {
        var account = await db.Accounts.FirstOrDefaultAsync(x => x.Code == code && x.IsActive, cancellationToken);
        if (account is not null) return account;
        var chart = await db.ChartOfAccounts.FirstOrDefaultAsync(x => x.Code == "DEFAULT" && x.IsActive, cancellationToken);
        if (chart is null)
        {
            chart = new ChartOfAccounts { Code = "DEFAULT", Name = "Default Chart of Accounts", Description = "System default chart" };
            await db.ChartOfAccounts.AddAsync(chart, cancellationToken);
        }
        account = new Account { ChartOfAccountsId = chart.Id, Code = code, Name = name, AccountType = type };
        await db.Accounts.AddAsync(account, cancellationToken);
        return account;
    }

    public async Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.Payments.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(receiptNumber)) query = query.Where(p => p.ReceiptNumber.Contains(receiptNumber.Trim()));
        if (!string.IsNullOrWhiteSpace(paymentMethod)) query = query.Where(p => p.PaymentMethod == paymentMethod.Trim());
        if (from.HasValue) query = query.Where(p => p.PaidAt.Date >= from.Value.ToDateTime(TimeOnly.MinValue));
        if (to.HasValue) query = query.Where(p => p.PaidAt.Date <= to.Value.ToDateTime(TimeOnly.MaxValue));
        return await query.OrderByDescending(p => p.PaidAt).ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
