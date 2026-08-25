using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IAcademicClassRepository
{
    Task<IReadOnlyList<AcademicClass>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AcademicClass>> GetByPeriodAsync(Guid periodId, CancellationToken cancellationToken = default);
    Task<AcademicClass?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(Guid programmeId, Guid periodId, string code, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(AcademicClass academicClass, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
