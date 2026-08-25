using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.StudentRecords;

public interface IStudentRecordsRepository
{
    Task<Student?> GetStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentGuardian>> GetGuardiansAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddGuardianAsync(StudentGuardian guardian, CancellationToken cancellationToken = default);
    Task<StudentGuardian?> GetGuardianAsync(Guid studentId, Guid guardianId, CancellationToken cancellationToken = default);
    void RemoveGuardian(StudentGuardian guardian);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
