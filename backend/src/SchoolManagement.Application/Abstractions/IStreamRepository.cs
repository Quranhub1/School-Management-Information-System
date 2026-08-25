using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IStreamRepository
{
    Task<IReadOnlyList<Stream>> GetByClassAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<Stream?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Stream stream, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
