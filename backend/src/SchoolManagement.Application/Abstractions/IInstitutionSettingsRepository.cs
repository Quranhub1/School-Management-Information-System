using SchoolManagement.Domain.Administration;

namespace SchoolManagement.Application.Abstractions;

public interface IInstitutionSettingsRepository
{
    Task<IReadOnlyList<InstitutionSettings>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<InstitutionSettings?> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<InstitutionSettings?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(InstitutionSettings settings, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
