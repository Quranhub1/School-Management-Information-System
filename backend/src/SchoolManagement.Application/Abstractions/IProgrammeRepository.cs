using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IProgrammeRepository
{
    Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Programme programme, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
