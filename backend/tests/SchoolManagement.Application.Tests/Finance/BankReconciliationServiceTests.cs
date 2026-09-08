using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class BankReconciliationServiceTests
{
    [Fact]
    public async Task GetOutstandingReportAsync_ReturnsOnlyUnmatchedLinesAndAgesThem()
    {
        var reconciliationId = Guid.NewGuid();
        var accountId = Guid.NewGuid();
        var statementDate = new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        var repository = new InMemoryBankReconciliationRepository
        {
            Reconciliation = new BankReconciliation
            {
                Id = reconciliationId,
                BankAccountId = accountId,
                StatementDate = statementDate,
                StatementBalance = 100000m,
                BookBalance = 95000m,
                ReconciledAmount = 0m,
                Status = "Pending"
            }
        };

        repository.Lines.Add(new BankStatementLine
        {
            BankReconciliationId = reconciliationId,
            TransactionDate = statementDate.AddDays(4),
            Amount = 12000m,
            TransactionType = "Debit",
            Description = "Bank charge",
            Reference = "BC-001",
            IsMatched = false
        });
        repository.Lines.Add(new BankStatementLine
        {
            BankReconciliationId = reconciliationId,
            TransactionDate = statementDate.AddDays(2),
            Amount = 25000m,
            TransactionType = "Credit",
            IsMatched = false
        });
        repository.Lines.Add(new BankStatementLine
        {
            BankReconciliationId = reconciliationId,
            TransactionDate = statementDate.AddDays(1),
            Amount = 5000m,
            TransactionType = "Debit",
            IsMatched = true
        });

        var service = new BankReconciliationService(repository, new NullFinanceRepository());
        var report = await service.GetOutstandingReportAsync(
            reconciliationId,
            statementDate.AddDays(10));

        Assert.Equal(3, report.TotalLines);
        Assert.Equal(1, report.MatchedLines);
        Assert.Equal(2, report.UnmatchedLines);
        Assert.Equal(25000m, report.UnmatchedCredits);
        Assert.Equal(12000m, report.UnmatchedDebits);
        Assert.Equal(5000m, report.Difference);
        Assert.Equal(2, report.OutstandingLines.Count);
        Assert.Equal(8, report.OutstandingLines[0].AgeDays);
        Assert.Equal(6, report.OutstandingLines[1].AgeDays);
        Assert.Equal("BC-001", report.OutstandingLines[1].Reference);
    }

    [Fact]
    public async Task GetOutstandingReportAsync_RejectsReportDateBeforeStatementDate()
    {
        var statementDate = new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.Zero);
        var repository = new InMemoryBankReconciliationRepository
        {
            Reconciliation = new BankReconciliation
            {
                BankAccountId = Guid.NewGuid(),
                StatementDate = statementDate,
                StatementBalance = 100m,
                BookBalance = 100m,
                ReconciledAmount = 100m,
                Status = "Reconciled"
            }
        };

        var service = new BankReconciliationService(repository, new NullFinanceRepository());
        await Assert.ThrowsAsync<ArgumentException>(() => service.GetOutstandingReportAsync(Guid.NewGuid(), statementDate.AddDays(-1)));
    }

    private sealed class InMemoryBankReconciliationRepository : IBankReconciliationRepository
    {
        public BankReconciliation? Reconciliation { get; set; }
        public List<BankStatementLine> Lines { get; } = [];

        public Task<IReadOnlyList<BankReconciliation>> GetAsync(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<BankReconciliation>>(Reconciliation is null ? [] : [Reconciliation]);
        public Task<BankReconciliation?> GetAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(Reconciliation?.Id == id ? Reconciliation : null);
        public Task<IReadOnlyList<BankStatementLine>> GetLinesAsync(Guid reconciliationId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<BankStatementLine>>(Lines.Where(x => x.BankReconciliationId == reconciliationId).ToArray());
        public Task<BankStatementLine?> GetLineAsync(Guid lineId, CancellationToken cancellationToken) =>
            Task.FromResult(Lines.FirstOrDefault(x => x.Id == lineId));
        public Task AddAsync(BankReconciliation reconciliation, CancellationToken cancellationToken) { Reconciliation = reconciliation; return Task.CompletedTask; }
        public Task AddLineAsync(BankStatementLine line, CancellationToken cancellationToken) { Lines.Add(line); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class NullFinanceRepository : IFinanceRepository
    {
        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult<StudentInvoice?>(null);
        public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) => Task.FromResult<FeeStructure?>(null);
        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<Payment?> GetPaymentAsync(Guid paymentId, CancellationToken cancellationToken) => Task.FromResult<Payment?>(null);
        public Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid studentId, string currency, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<PaymentLedgerEntry>>([]);
        public Task<bool> JournalEntryNumberExistsAsync(string entryNumber, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken cancellationToken) => Task.FromResult<Account?>(null);
        public Task<Account?> GetActiveAccountByIdAsync(Guid accountId, CancellationToken cancellationToken) => Task.FromResult<Account?>(null);
        public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid journalEntryId, CancellationToken cancellationToken) => Task.FromResult<JournalEntry?>(null);
        public Task<bool> HasReversalAsync(Guid journalEntryId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid discountId, CancellationToken cancellationToken) => Task.FromResult<InvoiceDiscount?>(null);
        public Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<InvoiceDiscount>>([]);
        public Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<InvoiceInstallment>>([]);
        public Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid studentId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<StudentCharge>>([]);
        public Task<StudentCharge?> GetStudentChargeAsync(Guid chargeId, CancellationToken cancellationToken) => Task.FromResult<StudentCharge?>(null);
        public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<CreditNote>>([]);
        public Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<CreditNote>>([]);
        public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken) => Task.FromResult<CreditNote?>(null);
        public Task AddInvoiceInstallmentAsync(InvoiceInstallment installment, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddStudentChargeAsync(StudentCharge charge, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddInvoiceDiscountAsync(InvoiceDiscount discount, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<JournalEntry>>([]);
        public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Payment>>([]);
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
