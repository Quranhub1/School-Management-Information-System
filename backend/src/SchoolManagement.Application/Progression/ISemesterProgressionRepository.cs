using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Progression;

public interface ISemesterProgressionRepository
{
    Task AddAsync(StudentPromotion promotion, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid studentId, Guid fromSemesterId, CancellationToken cancellationToken = default);
}
