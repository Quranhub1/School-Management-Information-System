using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Progression;
using SchoolManagement.Domain.Progression;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class SemesterProgressionRepository : ISemesterProgressionRepository
{
    private readonly SchoolManagementDbContext _db;
    public SemesterProgressionRepository(SchoolManagementDbContext db) => _db = db;

    public async Task AddAsync(SemesterProgressionDecision decision, CancellationToken cancellationToken = default)
    {
        _db.Set<SemesterProgressionDecision>().Add(decision);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid studentId, Guid fromSemesterId, CancellationToken cancellationToken = default) =>
        _db.Set<SemesterProgressionDecision>().AnyAsync(x => x.StudentId == studentId && x.FromSemesterId == fromSemesterId, cancellationToken);
}
