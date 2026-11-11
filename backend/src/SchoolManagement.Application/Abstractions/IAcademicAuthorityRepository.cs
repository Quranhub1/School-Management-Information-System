using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IAcademicAuthorityRepository
{
    Task<IReadOnlyList<AcademicAuthority>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<AcademicAuthority?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default);
    Task AddAsync(AcademicAuthority authority, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
