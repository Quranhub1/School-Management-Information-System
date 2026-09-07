using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IStreamRepository
{
    Task<IReadOnlyList<SchoolManagement.Domain.Academic.Stream>> GetByClassAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<SchoolManagement.Domain.Academic.Stream?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(SchoolManagement.Domain.Academic.Stream stream, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
