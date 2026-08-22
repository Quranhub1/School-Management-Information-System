using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ICurriculumRepository
{
    Task<IReadOnlyList<Curriculum>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Curriculum?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> VersionExistsAsync(Guid programmeId, string version, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Curriculum curriculum, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
