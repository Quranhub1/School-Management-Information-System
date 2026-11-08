using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class StudentChargeServiceTests
{
    [Fact]
    public async Task CreateAsync_PostsChargeAndLedgerEntry()
    {
        var studentId = Guid.NewGuid();
        var repository = new InMemoryFinanceRepository(studentId);
        var fiscalPeriods = new StubFiscalPeriodRepository();
        var service = new StudentChargeService(repository, new FiscalPeriodService(fiscalPeriods));

        var charge = await service.CreateAsync(studentId, "LibraryFine", "Lost textbook", 12500.567m, "ugx", "admin");

        Assert.Equal("Posted", charge.Status);
        Assert.Equal(12500.57m, charge.Amount);
        Assert.Equal("UGX", charge.Currency);
        Assert.Single(repository.Charges);
        Assert.Single(repository.JournalEntries);
        Assert.Single(repository.LedgerEntries);
        Assert.Equal(12500.57m, repository.LedgerEntries[0].Amount);
    }

    [Fact]
    public async Task VoidAsync_ReversesChargeAndRecordsNegativeLedgerEntry()
    {
        var studentId = Guid.NewGuid();
        var repository = new InMemoryFinanceRepository(studentId);
        var fiscalPeriods = new StubFiscalPeriodRepository();
        var service = new StudentChargeService(repository, new FiscalPeriodService(fiscalPeriods));
        var charge = await service.CreateAsync(studentId, "ExamFee", "Special examination", 50000m, "UGX", "admin");

        var voided = await service.VoidAsync(charge.Id, "Charge entered in error", "manager");

        Assert.Equal("Voided", voided.Status);
        Assert.Equal("manager", voided.VoidedBy);
        Assert.Equal("Charge entered in error", voided.VoidReason);
        Assert.Equal(2, repository.JournalEntries.Count);
        Assert.Equal(2, repository.LedgerEntries.Count);
        Assert.Equal(-50000m, repository.LedgerEntries[1].Amount);
    }

    [Fact]
    public async Task CreateAsync_RejectsUnknownStudent()
    {
        var repository = new InMemoryFinanceRepository(Guid.NewGuid());
        var service = new StudentChargeService(repository, new FiscalPeriodService(new StubFiscalPeriodRepository()));
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Guid.NewGuid(), "LibraryFine", "Lost book", 1000m, "UGX", "admin"));
    }

    private sealed class StubFiscalPeriodRepository : IFiscalPeriodRepository
    {
        private readonly FiscalPeriod period = new() { Name = "Test Period", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        public Task<IReadOnlyList<FiscalPeriod>> GetFiscalPeriodsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<FiscalPeriod>>([period]);
        public Task<FiscalPeriod?> GetFiscalPeriodAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<FiscalPeriod?>(period.Id == id ? period : null);
        public Task<FiscalPeriod?> GetContainingPeriodAsync(DateOnly date, CancellationToken cancellationToken = default) => Task.FromResult<FiscalPeriod?>(period.Contains(date) ? period : null);
        public Task<bool> NameExistsAsync(string name, Guid? excludingId = null, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> HasOverlappingPeriodAsync(DateOnly startDate, DateOnly endDate, Guid? excludingId = null, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddAsync(FiscalPeriod fiscalPeriod, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryFinanceRepository(Guid studentId) : IFinanceRepository
    {
        public List<StudentCharge> Charges { get; } = [];
        public List<JournalEntry> JournalEntries { get; } = [];
        public List<PaymentLedgerEntry> LedgerEntries { get; } = [];
        private readonly List<CreditNote> creditNotes = [];

        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult<StudentInvoice?>(null);
        public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid id, CancellationToken ct) => Task.FromResult<FeeStructure?>(null);
        public Task<bool> StudentExistsAsync(Guid id, CancellationToken ct) => Task.FromResult(id == studentId);
        public Task<bool> InvoiceNumberExistsAsync(string n, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> ReceiptExistsAsync(string n, CancellationToken ct) => Task.FromResult(false);
        public Task<Payment?> GetPaymentAsync(Guid id, CancellationToken ct) => Task.FromResult<Payment?>(null);
        public Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid id, string currency, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<PaymentLedgerEntry>>([]);
        public Task<bool> JournalEntryNumberExistsAsync(string n, CancellationToken ct) => Task.FromResult(JournalEntries.Any(x => x.EntryNumber == n));
        public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken ct) => Task.FromResult<Account?>(new Account { Code = code, Name = code, AccountType = code == FinanceAccountCodes.StudentReceivables ? "Asset" : "Income", ChartOfAccountsId = Guid.NewGuid(), IsActive = true });
        public Task<Account?> GetActiveAccountByIdAsync(Guid id, CancellationToken ct) => Task.FromResult<Account?>(null);
        public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid id, CancellationToken ct) => Task.FromResult<JournalEntry?>(JournalEntries.FirstOrDefault(x => x.Id == id));
        public Task<bool> HasReversalAsync(Guid id, CancellationToken ct) => Task.FromResult(false);
        public Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid id, CancellationToken ct) => Task.FromResult<InvoiceDiscount?>(null);
        public Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<InvoiceDiscount>>([]);
        public Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<InvoiceInstallment>>([]);
        public Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentCharge>>(Charges.Where(x => x.StudentId == id).ToArray());
        public Task<StudentCharge?> GetStudentChargeAsync(Guid id, CancellationToken ct) => Task.FromResult(Charges.FirstOrDefault(x => x.Id == id));
        public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken ct) => Task.FromResult<IReadOnlyList<CreditNote>>(creditNotes.Where(x => x.StudentInvoiceId == studentInvoiceId).ToArray());
        public Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<CreditNote>>(creditNotes.ToArray());
        public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken ct) => Task.FromResult(creditNotes.FirstOrDefault(x => x.Id == creditNoteId));
        public Task AddInvoiceInstallmentAsync(InvoiceInstallment x, CancellationToken ct) => Task.CompletedTask;
        public Task AddStudentChargeAsync(StudentCharge x, CancellationToken ct) { Charges.Add(x); return Task.CompletedTask; }
        public Task AddInvoiceAsync(StudentInvoice x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentAsync(Payment x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentAllocationAsync(PaymentAllocation x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry x, CancellationToken ct) { LedgerEntries.Add(x); return Task.CompletedTask; }
        public Task AddInvoiceDiscountAsync(InvoiceDiscount x, CancellationToken ct) => Task.CompletedTask;
        public Task AddCreditNoteAsync(CreditNote x, CancellationToken ct) { creditNotes.Add(x); return Task.CompletedTask; }
        public Task AddJournalEntryAsync(JournalEntry x, CancellationToken ct) { JournalEntries.Add(x); return Task.CompletedTask; }
        public Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken ct) => Task.FromResult<IReadOnlyList<JournalEntry>>(JournalEntries);
        public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Payment>>([]);
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }
}
