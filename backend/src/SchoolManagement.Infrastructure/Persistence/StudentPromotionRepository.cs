using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Students;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class StudentPromotionRepository(SchoolManagementDbContext db) : IStudentPromotionRepository
{
    public Task<StudentPromotion?> GetBySourcePeriodAsync(Guid studentId, Guid academicYearId, Guid semesterId, CancellationToken cancellationToken = default) =>
        db.StudentPromotions.FirstOrDefaultAsync(x =>
            x.StudentId == studentId &&
            x.FromAcademicYearId == academicYearId &&
            x.FromSemesterId == semesterId,
            cancellationToken);

    public async Task AddAsync(StudentPromotion promotion, CancellationToken cancellationToken = default) =>
        await db.StudentPromotions.AddAsync(promotion, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
