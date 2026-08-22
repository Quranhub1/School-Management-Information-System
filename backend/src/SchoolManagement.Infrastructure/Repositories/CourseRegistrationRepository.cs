using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CourseRegistrationRepository(SchoolManagementDbContext db) : ICourseRegistrationRepository
{
    public async Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken ct = default)
        => await db.CourseRegistrations.AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.RegisteredAt).ToListAsync(ct);

    public Task<bool> ExistsActiveAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken ct = default)
        => db.CourseRegistrations.AnyAsync(x => x.StudentId == studentId && x.CourseId == courseId && x.SemesterId == semesterId && x.Status != "Dropped" && x.Status != "Withdrawn", ct);

    public Task AddAsync(CourseRegistration registration, CancellationToken ct = default)
        => db.CourseRegistrations.AddAsync(registration, ct).AsTask();

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
