using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Students;

public interface IStudentPromotionRepository
{
    Task<StudentPromotion?> GetBySourcePeriodAsync(Guid studentId, Guid academicYearId, Guid semesterId, CancellationToken cancellationToken = default);
    Task AddAsync(StudentPromotion promotion, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
