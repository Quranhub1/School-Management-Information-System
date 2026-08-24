using SchoolManagement.Domain.Progression;

namespace SchoolManagement.Application.Progression;

public interface ISemesterProgressionRepository
{
    Task AddAsync(SemesterProgressionDecision decision, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid studentId, Guid fromSemesterId, CancellationToken cancellationToken = default);
}
