using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IProgrammeRepository
{
    Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
