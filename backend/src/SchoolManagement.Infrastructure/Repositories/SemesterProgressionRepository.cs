using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Progression;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class SemesterProgressionRepository : ISemesterProgressionRepository
{
    private readonly SchoolManagementDbContext _db;
    public SemesterProgressionRepository(SchoolManagementDbContext db) => _db = db;

    public async Task AddAsync(StudentPromotion promotion, CancellationToken cancellationToken = default)
    {
        _db.StudentPromotions.Add(promotion);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid studentId, Guid fromSemesterId, CancellationToken cancellationToken = default) =>
        _db.StudentPromotions.AnyAsync(x => x.StudentId == studentId && x.FromSemesterId == fromSemesterId, cancellationToken);
}
