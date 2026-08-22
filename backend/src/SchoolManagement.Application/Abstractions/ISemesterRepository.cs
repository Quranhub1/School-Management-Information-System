using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface ISemesterRepository
{
    Task<IReadOnlyList<Semester>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken cancellationToken = default);
    Task<Semester?> GetByIdAsync(Guid id, bool tracked = false, CancellationToken cancellationToken = default);
    Task<bool> NameOrSequenceExistsAsync(Guid academicYearId, string name, int sequence, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task<bool> OverlapsAsync(Guid academicYearId, DateOnly startDate, DateOnly endDate, Guid? excludingId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Semester semester, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
