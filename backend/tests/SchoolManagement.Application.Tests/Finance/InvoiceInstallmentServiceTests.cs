using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class InvoiceInstallmentServiceTests
{
    [Fact]
    public async Task CreateScheduleAsync_PercentageScheduleTotalsInvoiceOutstanding()
    {
        var invoice = CreateInvoice(100000m);
        var repository = new InMemoryFinanceRepository(invoice);
        var service = new InvoiceInstallmentService(repository);

        var result = await service.CreateScheduleAsync(invoice.Id,
        [
            new(1, new DateOnly(2026, 10, 1), 33.33m, null),
            new(2, new DateOnly(2026, 11, 1), 33.33m, null),
            new(3, new DateOnly(2026, 12, 1), 33.34m, null)
        ], CancellationToken.None);

        Assert.Equal(3, result.Count);
        Assert.Equal(100000m, result.Sum(x => x.Amount));
        Assert.Equal(33330m, result[0].Amount);
        Assert.Equal(33340m, result[2].Amount);
    }

    [Fact]
    public async Task CreateScheduleAsync_RejectsMixedAmountAndPercentageTerms()
    {
        var invoice = CreateInvoice(100000m);
        var service = new InvoiceInstallmentService(new InMemoryFinanceRepository(invoice));

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateScheduleAsync(invoice.Id,
        [
            new(1, new DateOnly(2026, 10, 1), 50m, null),
            new(2, new DateOnly(2026, 11, 1), null, 50000m)
        ], CancellationToken.None));
    }

    [Fact]
    public async Task CreateScheduleAsync_RejectsScheduleThatDoesNotTotalOutstanding()
    {
        var invoice = CreateInvoice(100000m);
        var service = new InvoiceInstallmentService(new InMemoryFinanceRepository(invoice));

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateScheduleAsync(invoice.Id,
        [
            new(1, new DateOnly(2026, 10, 1), null, 60000m),
            new(2, new DateOnly(2026, 11, 1), null, 30000m)
        ], CancellationToken.None));
    }

    private static StudentInvoice CreateInvoice(decimal amount) => new()
    {
        StudentId = Guid.NewGuid(),
        InvoiceNumber = "INV-TEST",
        Amount = amount,
        PaidAmount = 0,
        Currency = "UGX",
        Status = "Unpaid"
    };

    private sealed class InMemoryFinanceRepository(StudentInvoice invoice) : SchoolManagement.Application.Abstractions.IFinanceRepository
    {
        private readonly List<InvoiceInstallment> stored = [];

        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult(invoiceId == invoice.Id ? invoice : null);
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
        public Task<IReadOnlyList<InvoiceInstallment>> GetInvoiceInstallmentsAsync(Guid invoiceId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<InvoiceInstallment>>(stored.Where(x => x.StudentInvoiceId == invoiceId).ToArray());
        public Task AddInvoiceInstallmentAsync(InvoiceInstallment installment, CancellationToken cancellationToken) { stored.Add(installment); return Task.CompletedTask; }
        public Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentAllocationAsync(PaymentAllocation allocation, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddPaymentLedgerEntryAsync(PaymentLedgerEntry entry, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddInvoiceDiscountAsync(InvoiceDiscount discount, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task AddJournalEntryAsync(JournalEntry journalEntry, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<IReadOnlyList<JournalEntry>> GetPostedJournalEntriesAsync(DateOnly? from, DateOnly? to, Guid? accountId, CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<JournalEntry>>([]);
        public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Payment>>([]);
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
