using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IAcademicYearRepository
{
    Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AcademicYear?> GetByIdAsync(Guid id, bool tracked = false, CancellationToken cancellationToken = default);
    Task<bool> NameExistsAsync(string name, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
