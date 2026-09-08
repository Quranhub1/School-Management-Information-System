using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class CreditNoteRefundServiceTests
{
    [Fact]
    public async Task CreateCreditNoteAsync_PostsReversalAndNegativeLedgerEntry()
    {
        var invoice = new StudentInvoice { StudentId = Guid.NewGuid(), InvoiceNumber = "INV-001", Amount = 100000m, PaidAmount = 100000m, Currency = "UGX", Status = "Paid" };
        var finance = new InMemoryFinanceRepository(invoice);
        var adjustments = new InMemoryAdjustmentsRepository();
        var periods = new InMemoryFiscalPeriodRepository();
        var service = new CreditNoteRefundService(finance, adjustments, new FiscalPeriodService(periods));

        var creditNote = await service.CreateCreditNoteAsync(invoice.Id, 25000m, "Fee overcharge", "manager");

        Assert.Equal("Applied", creditNote.Status);
        Assert.Equal(25000m, creditNote.Amount);
        Assert.Single(adjustments.CreditNotes);
        Assert.Single(finance.JournalEntries);
        Assert.Equal(-25000m, finance.LedgerEntries.Single().Amount);
        Assert.Equal("CreditNote", finance.JournalEntries.Single().SourceType);
    }

    [Fact]
    public async Task CreateCreditNoteAsync_RejectsCreditBeyondInvoiceValue()
    {
        var invoice = new StudentInvoice { StudentId = Guid.NewGuid(), InvoiceNumber = "INV-002", Amount = 50000m, PaidAmount = 50000m, Currency = "UGX", Status = "Paid" };
        var periods = new InMemoryFiscalPeriodRepository();
        var service = new CreditNoteRefundService(new InMemoryFinanceRepository(invoice), new InMemoryAdjustmentsRepository(), new FiscalPeriodService(periods));

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateCreditNoteAsync(invoice.Id, 50001m, "Invalid credit", "manager"));
    }

    [Fact]
    public async Task CancelCreditNoteAsync_CreatesReversalAndStoresAuditTrail()
    {
        var invoice = new StudentInvoice { StudentId = Guid.NewGuid(), InvoiceNumber = "INV-CANCEL", Amount = 100000m, PaidAmount = 100000m, Currency = "UGX", Status = "Paid" };
        var finance = new InMemoryFinanceRepository(invoice);
        var adjustments = new InMemoryAdjustmentsRepository();
        var service = new CreditNoteRefundService(finance, adjustments, new FiscalPeriodService(new InMemoryFiscalPeriodRepository()));

        var creditNote = await service.CreateCreditNoteAsync(invoice.Id, 25000m, "Fee overcharge", "manager");
        var cancelled = await service.CancelCreditNoteAsync(creditNote.Id, "Correction approved", "auditor");

        Assert.Equal("Cancelled", cancelled.Status);
        Assert.Equal("auditor", cancelled.CancelledBy);
        Assert.Equal("Correction approved", cancelled.CancellationReason);
        Assert.NotNull(cancelled.CancelledAt);
        Assert.Equal(2, finance.JournalEntries.Count);
        var reversal = finance.JournalEntries.Single(x => x.ReversalOfJournalEntryId == finance.JournalEntries.Single(y => y.SourceType == "CreditNote").Id);
        Assert.Equal("JournalReversal", reversal.SourceType);
        Assert.Equal(finance.JournalEntries.Single(x => x.SourceType == "CreditNote").Lines.Single(x => x.Debit > 0).AccountId, reversal.Lines.Single(x => x.Credit > 0).AccountId);
    }

    [Fact]
    public async Task CancelCreditNoteAsync_IsIdempotencyProtected()
    {
        var invoice = new StudentInvoice { StudentId = Guid.NewGuid(), InvoiceNumber = "INV-CANCEL-2", Amount = 100000m, PaidAmount = 100000m, Currency = "UGX", Status = "Paid" };
        var finance = new InMemoryFinanceRepository(invoice);
        var adjustments = new InMemoryAdjustmentsRepository();
        var service = new CreditNoteRefundService(finance, adjustments, new FiscalPeriodService(new InMemoryFiscalPeriodRepository()));

        var creditNote = await service.CreateCreditNoteAsync(invoice.Id, 10000m, "Correction", "manager");
        await service.CancelCreditNoteAsync(creditNote.Id, "Wrong amount", "auditor");

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CancelCreditNoteAsync(creditNote.Id, "Second cancellation", "auditor"));
        Assert.Equal(2, finance.JournalEntries.Count);
    }

    [Fact]
    public async Task CreateCreditNoteAsync_AllowsRecreditAfterCancellation()
    {
        var invoice = new StudentInvoice { StudentId = Guid.NewGuid(), InvoiceNumber = "INV-CANCEL-3", Amount = 50000m, PaidAmount = 50000m, Currency = "UGX", Status = "Paid" };
        var finance = new InMemoryFinanceRepository(invoice);
        var adjustments = new InMemoryAdjustmentsRepository();
        var service = new CreditNoteRefundService(finance, adjustments, new FiscalPeriodService(new InMemoryFiscalPeriodRepository()));

        var first = await service.CreateCreditNoteAsync(invoice.Id, 50000m, "Original correction", "manager");
        await service.CancelCreditNoteAsync(first.Id, "Correction withdrawn", "auditor");
        var second = await service.CreateCreditNoteAsync(invoice.Id, 50000m, "Corrected credit", "manager");

        Assert.Equal("Cancelled", first.Status);
        Assert.Equal("Applied", second.Status);
        Assert.Equal(2, adjustments.CreditNotes.Count);
    }

    [Fact]
    public async Task CreateRefundAsync_RejectsCancelledCreditNote()
    {
        var studentId = Guid.NewGuid();
        var invoice = new StudentInvoice { StudentId = studentId, InvoiceNumber = "INV-REFUND", Amount = 50000m, PaidAmount = 50000m, Currency = "UGX", Status = "Paid" };
        var payment = new Payment { StudentId = studentId, ReceiptNumber = "RCT-CN-001", Amount = 50000m, Currency = "UGX", PaymentMethod = "Cash" };
        var finance = new InMemoryFinanceRepository(invoice, payment);
        var adjustments = new InMemoryAdjustmentsRepository();
        var service = new CreditNoteRefundService(finance, adjustments, new FiscalPeriodService(new InMemoryFiscalPeriodRepository()));

        var creditNote = await service.CreateCreditNoteAsync(invoice.Id, 25000m, "Refundable overcharge", "manager");
        await service.CancelCreditNoteAsync(creditNote.Id, "Cancelled before refund", "auditor");

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateRefundAsync(payment.Id, 10000m, "Cash", "Refund", null, "manager", creditNote.Id));
    }

    [Fact]
    public async Task CreateRefundAsync_PreventsRefundingMoreThanPayment()
    {
        var studentId = Guid.NewGuid();
        var payment = new Payment { StudentId = studentId, ReceiptNumber = "RCT-001", Amount = 40000m, Currency = "UGX", PaymentMethod = "Cash" };
        var periods = new InMemoryFiscalPeriodRepository();
        var finance = new InMemoryFinanceRepository(null, payment);
        var service = new CreditNoteRefundService(finance, new InMemoryAdjustmentsRepository(), new FiscalPeriodService(periods));

        var refund = await service.CreateRefundAsync(payment.Id, 15000m, "Cash", "Approved refund", null, "manager");

        Assert.Equal(15000m, refund.Amount);
        Assert.Equal("Completed", refund.Status);
        Assert.Equal("Refund", finance.JournalEntries.Single().SourceType);
        Assert.Equal(15000m, finance.LedgerEntries.Single().Amount);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateRefundAsync(payment.Id, 25001m, "Cash", "Second refund", null, "manager"));
    }

    private sealed class InMemoryFiscalPeriodRepository : IFiscalPeriodRepository
    {
        private readonly List<FiscalPeriod> periods =
        [
            new FiscalPeriod
            {
                Name = $"Test FY {DateTime.UtcNow:yyyy}",
                StartDate = new DateOnly(DateTime.UtcNow.Year, 1, 1),
                EndDate = new DateOnly(DateTime.UtcNow.Year, 12, 31)
            }
        ];

        public Task<IReadOnlyList<FiscalPeriod>> GetFiscalPeriodsAsync(CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<FiscalPeriod>>(periods);
        public Task<FiscalPeriod?> GetFiscalPeriodAsync(Guid id, CancellationToken cancellationToken) => Task.FromResult(periods.SingleOrDefault(x => x.Id == id));
        public Task<FiscalPeriod?> GetContainingPeriodAsync(DateOnly date, CancellationToken cancellationToken) => Task.FromResult(periods.SingleOrDefault(x => x.Contains(date)));
        public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken) => Task.FromResult(periods.Any(x => x.Name == name && x.Id != excludingId));
        public Task<bool> HasOverlappingPeriodAsync(DateOnly startDate, DateOnly endDate, Guid? excludingId, CancellationToken cancellationToken) => Task.FromResult(periods.Any(x => x.Id != excludingId && x.StartDate <= endDate && startDate <= x.EndDate));
        public Task AddAsync(FiscalPeriod period, CancellationToken cancellationToken) { periods.Add(period); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class InMemoryAdjustmentsRepository : IFinanceAdjustmentsRepository
    {
        public List<CreditNote> CreditNotes { get; } = [];
        public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken) => Task.FromResult(CreditNotes.FirstOrDefault(x => x.Id == creditNoteId));
        public Task<CreditNote?> GetCreditNoteForUpdateAsync(Guid creditNoteId, CancellationToken cancellationToken) => Task.FromResult(CreditNotes.FirstOrDefault(x => x.Id == creditNoteId));
        public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<CreditNote>>(CreditNotes.Where(x => x.StudentInvoiceId == studentInvoiceId).ToArray());
        public Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken) { CreditNotes.Add(creditNote); return Task.CompletedTask; }
    }

    private sealed class InMemoryFinanceRepository : global::SchoolManagement.Application.Finance.IFinanceRepository
    {
        private readonly StudentInvoice? invoice;
        private readonly Payment? payment;
        private readonly List<CreditNote> creditNotes = [];
        public List<JournalEntry> JournalEntries { get; } = [];
        public List<PaymentLedgerEntry> LedgerEntries { get; } = [];

        public InMemoryFinanceRepository(StudentInvoice? invoice, Payment? payment = null) { this.invoice = invoice; this.payment = payment; }
        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult(invoice?.Id == invoiceId ? invoice : null);
        public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>(invoice is null ? [] : [invoice]);
        public Task<IReadOnlyList<StudentInvoice>> GetAllStudentInvoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>(invoice is null ? [] : [invoice]);
        public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid id, CancellationToken ct) => Task.FromResult<FeeStructure?>(null);
        public Task<bool> StudentExistsAsync(Guid id, CancellationToken ct) => Task.FromResult((invoice?.StudentId == id) || (payment?.StudentId == id));
        public Task<bool> InvoiceNumberExistsAsync(string n, CancellationToken ct) => Task.FromResult(false);
        public Task<bool> ReceiptExistsAsync(string n, CancellationToken ct) => Task.FromResult(false);
        public Task<Payment?> GetPaymentAsync(Guid id, CancellationToken ct) => Task.FromResult(payment?.Id == id ? payment : null);
        public Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid id, string currency, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentInvoice>>([]);
        public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<PaymentLedgerEntry>>(LedgerEntries);
        public Task<bool> JournalEntryNumberExistsAsync(string n, CancellationToken ct) => Task.FromResult(JournalEntries.Any(x => x.EntryNumber == n));
        public Task<Account?> GetActiveAccountByCodeAsync(string code, CancellationToken ct) => Task.FromResult<Account?>(new Account { Code = code, Name = code, AccountType = code == FinanceAccountCodes.StudentReceivables ? "Asset" : "Income", ChartOfAccountsId = Guid.NewGuid(), IsActive = true });
        public Task<Account?> GetActiveAccountByIdAsync(Guid id, CancellationToken ct) => Task.FromResult<Account?>(null);
        public Task<JournalEntry?> GetPostedJournalEntryAsync(Guid id, CancellationToken ct) => Task.FromResult<JournalEntry?>(JournalEntries.FirstOrDefault(x => x.Id == id));
        public Task<bool> HasReversalAsync(Guid id, CancellationToken ct) => Task.FromResult(JournalEntries.Any(x => x.ReversalOfJournalEntryId == id));
        public Task<InvoiceDiscount?> GetInvoiceDiscountAsync(Guid id, CancellationToken ct) => Task.FromResult<InvoiceDiscount?>(null);
        public Task<IReadOnlyList<InvoiceDiscount>> GetInvoiceDiscountsAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<InvoiceDiscount>>([]);
        public Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<InvoiceInstallment>>([]);
        public Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid id, CancellationToken ct) => Task.FromResult<IReadOnlyList<StudentCharge>>([]);
        public Task<StudentCharge?> GetStudentChargeAsync(Guid id, CancellationToken ct) => Task.FromResult<StudentCharge?>(null);
        public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid studentInvoiceId, CancellationToken ct) => Task.FromResult<IReadOnlyList<CreditNote>>(creditNotes.Where(x => x.StudentInvoiceId == studentInvoiceId).ToArray());
        public Task<IReadOnlyList<CreditNote>> GetAllCreditNotesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<CreditNote>>(creditNotes.ToArray());
        public Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken ct) => Task.FromResult(creditNotes.FirstOrDefault(x => x.Id == creditNoteId));
        public Task AddInvoiceInstallmentAsync(InvoiceInstallment x, CancellationToken ct) => Task.CompletedTask;
        public Task AddStudentChargeAsync(StudentCharge x, CancellationToken ct) => Task.CompletedTask;
        public Task AddInvoiceAsync(StudentInvoice x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentAsync(Payment x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentAllocationAsync(PaymentAllocation x, CancellationToken ct) => Task.CompletedTask;
        public Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry x, CancellationToken ct) { LedgerEntries.Add(x); return Task.CompletedTask; }
        public Task AddInvoiceDiscountAsync(InvoiceDiscount x, CancellationToken ct) => Task.CompletedTask;
        public Task AddCreditNoteAsync(CreditNote x, CancellationToken ct) { creditNotes.Add(x); return Task.CompletedTask; }
        public Task AddJournalEntryAsync(JournalEntry x, CancellationToken ct) { JournalEntries.Add(x); return Task.CompletedTask; }
        public Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken ct) => Task.FromResult<IReadOnlyList<JournalEntry>>(JournalEntries.Where(x => x.Status == "Posted").ToArray());
        public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Payment>>(payment is null ? [] : [payment]);
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }
}
