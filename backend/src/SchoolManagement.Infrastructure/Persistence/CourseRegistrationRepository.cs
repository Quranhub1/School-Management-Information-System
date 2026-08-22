using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class CourseRegistrationRepository(SchoolManagementDbContext db) : ICourseRegistrationRepository
{
    public Task<IReadOnlyList<CourseRegistration>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => db.CourseRegistrations.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.RegisteredAt)
            .ToListAsync(cancellationToken)
            .ContinueWith(t => (IReadOnlyList<CourseRegistration>)t.Result, cancellationToken);

    public Task<bool> ExistsActiveAsync(Guid studentId, Guid courseId, Guid semesterId, CancellationToken cancellationToken = default)
        => db.CourseRegistrations.AnyAsync(x => x.StudentId == studentId && x.CourseId == courseId && x.SemesterId == semesterId && x.Status == "Registered", cancellationToken);

    public async Task AddAsync(CourseRegistration registration, CancellationToken cancellationToken = default)
    {
        db.CourseRegistrations.Add(registration);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(CourseRegistration registration, CancellationToken cancellationToken = default)
    {
        db.CourseRegistrations.Update(registration);
        await db.SaveChangesAsync(cancellationToken);
    }
}
