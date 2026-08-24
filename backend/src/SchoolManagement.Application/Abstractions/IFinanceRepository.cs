using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceRepository
{
    Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken);
    Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken);
    Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken);
    Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken);
    Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken);
    Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}