using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Alumni;

public interface IAlumniRepository
{
    Task<IReadOnlyList<Alumni>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Alumni?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Alumni?> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync(Alumni alumni, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
