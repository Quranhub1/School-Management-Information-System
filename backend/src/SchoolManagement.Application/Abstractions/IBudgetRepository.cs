using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IBudgetRepository
{
    Task<IReadOnlyList<Budget>> GetAsync(Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken);
    Task<Budget?> GetAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(Budget budget, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
