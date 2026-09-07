using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ISubjectRepository
{
    Task<IReadOnlyList<Subject>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Subject>> GetByProgrammeAndYearAsync(Guid programmeId, int yearOfStudy, CancellationToken cancellationToken = default);
    Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> CourseExistsAsync(Guid programmeId, Guid courseId, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Subject subject, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
