using AlumniEntity = SchoolManagement.Domain.Students.Alumni;

namespace SchoolManagement.Application.Alumni;

public interface IAlumniRepository
{
    Task<IReadOnlyList<AlumniEntity>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<AlumniEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AlumniEntity?> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync(AlumniEntity alumni, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
