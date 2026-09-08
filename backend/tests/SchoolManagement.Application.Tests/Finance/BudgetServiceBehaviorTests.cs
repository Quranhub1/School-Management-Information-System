using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class BudgetServiceBehaviorTests
{
    [Fact]
    public async Task GetVsActualAsync_uses_only_postings_for_budget_department()
    {
        var department = Guid.NewGuid();
        var otherDepartment = Guid.NewGuid();
        var accountId = Guid.NewGuid();
        var account = new Account { Id = accountId, Code = "5100", Name = "Supplies", AccountType = "Expense" };
        var finance = new FakeFinanceRepository(account,
            new JournalEntry
            {
                EntryNumber = "J-001",
                Status = "Posted",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = accountId, Debit = 300m, Credit = 0m, DepartmentId = department },
                    new() { AccountId = accountId, Debit = 900m, Credit = 0m, DepartmentId = otherDepartment },
                    new() { AccountId = accountId, Debit = 700m, Credit = 0m, DepartmentId = null }
                }
            });
        var budgets = new FakeBudgetRepository(new Budget
        {
            DepartmentId = department,
            AcademicYearId = Guid.NewGuid(),
            Name = "Department Budget",
            Currency = "UGX",
            StartDate = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            EndDate = new DateTimeOffset(2026, 12, 31, 0, 0, 0, TimeSpan.Zero),
            Lines = new List<BudgetLine>
            {
                new() { AccountId = accountId, Category = "Supplies", AllocatedAmount = 1000m }
            }
        });

        var service = new BudgetService(budgets, finance);
        var rows = await service.GetVsActualAsync(budgets.Budget!.Id, new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31));

        var row = Assert.Single(rows);
        Assert.Equal(300m, row.Actual);
        Assert.Equal(700m, row.Variance);
    }

    private sealed class FakeBudgetRepository(Budget budget) : IBudgetRepository
    {
        public Budget? Budget { get; } = budget;
        public Task<IReadOnlyList<Budget>> GetAsync(Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<Budget>>(new[] { budget });
        public Task<Budget?> GetAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult<Budget?>(id == budget.Id ? budget : null);
        public Task AddAsync(Budget budget, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeFinanceRepository(Account account, params JournalEntry[] entries) : IFinanceRepository
    {
        public Task<Account?> GetActiveAccountByIdAsync(Guid accountId, CancellationToken cancellationToken) => Task.FromResult<Account?>(accountId == account.Id ? account : null);
        public Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<JournalEntry>>(entries);

        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Payment?> GetPaymentAsync(Guid paymentId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid studentId, string currency, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid journalEntryId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<bool> HasReversalAsync(Guid journalEntryId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid discountId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid invoiceId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid invoiceId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid studentId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<StudentCharge?> GetStudentChargeAsync(Guid chargeId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddInvoiceInstallmentAsync(InvoiceInstallment installment, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddStudentChargeAsync(StudentCharge charge, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddInvoiceDiscountAsync(InvoiceDiscount discount, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
