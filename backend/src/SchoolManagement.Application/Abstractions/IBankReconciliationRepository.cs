using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IBankReconciliationRepository
{
    Task<IReadOnlyList<BankReconciliation>> GetAsync(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken);
    Task<BankReconciliation?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(BankReconciliation reconciliation, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
