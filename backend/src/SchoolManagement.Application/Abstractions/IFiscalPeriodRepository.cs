using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFiscalPeriodRepository
{
    Task<IReadOnlyList<FiscalPeriod>> GetFiscalPeriodsAsync(CancellationToken cancellationToken);
    Task<FiscalPeriod?> GetFiscalPeriodAsync(Guid id, CancellationToken cancellationToken);
    Task<FiscalPeriod?> GetContainingPeriodAsync(DateOnly date, CancellationToken cancellationToken);
    Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken);
    Task<bool> HasOverlappingPeriodAsync(DateOnly startDate, DateOnly endDate, Guid? excludingId, CancellationToken cancellationToken);
    Task AddAsync(FiscalPeriod period, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
