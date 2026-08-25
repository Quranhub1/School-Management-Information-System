using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class FinanceWorkflowServiceTests
{
    [Fact]
    public async Task RecordPaymentAsync_RejectsNonPositiveAmount()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.RecordPaymentAsync(
            Guid.NewGuid(),
            "RC-001",
            0m,
            "Cash"));
    }

    [Fact]
    public async Task RecordPaymentAsync_RejectsMissingPaymentMethod()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.RecordPaymentAsync(
            Guid.NewGuid(),
            "RC-002",
            100m,
            "   "));
    }

    private static FinanceWorkflowService CreateService() =>
        new(new FinanceService(new InMemoryFinanceRepository()));

    private sealed class InMemoryFinanceRepository : IFinanceRepository
    {
        public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) =>
            Task.FromResult<StudentInvoice?>(null);

        public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<StudentInvoice>>([]);

        public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) =>
            Task.FromResult<FeeStructure?>(null);

        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) =>
            Task.FromResult(false);

        public Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
