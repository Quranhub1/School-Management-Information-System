using SchoolManagement.Domain.Documents;

namespace SchoolManagement.Infrastructure.Documents;

public interface IStudentDocumentRepository
{
    Task<StudentDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentDocument>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync(StudentDocument document, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
