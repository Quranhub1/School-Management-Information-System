using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class CourseRegistrationRepository(SchoolManagementDbContext db) : ICourseRegistrationRepository
{
    public async Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => await db.CourseRegistrations.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.RegisteredAt)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsActiveAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken cancellationToken = default)
        => db.CourseRegistrations.AnyAsync(x => x.StudentId == studentId && x.CourseId == courseId && x.SemesterId == semesterId && x.Status == "Registered", cancellationToken);

    public Task AddAsync(CourseRegistration registration, CancellationToken cancellationToken = default)
        => db.CourseRegistrations.AddAsync(registration, cancellationToken).AsTask();

    public async Task UpdateAsync(CourseRegistration registration, CancellationToken cancellationToken = default)
    {
        db.CourseRegistrations.Update(registration);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        => db.SaveChangesAsync(cancellationToken);
}
