using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFeeRepository
{
    Task<FeeStructure?> GetFeeStructureAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StudentInvoice?> GetInvoiceAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken = default);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
