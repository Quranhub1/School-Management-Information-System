using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CourseRepository(SchoolManagementDbContext db) : ICourseRepository
{
    public async Task<IReadOnlyList<Course>> GetAllAsync(CancellationToken ct = default) => await db.Courses.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);
    public Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Courses.FirstOrDefaultAsync(x => x.Id == id, ct);
    public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken ct = default) => db.Courses.AnyAsync(x => x.Code == code && (!excludingId.HasValue || x.Id != excludingId.Value), ct);
    public Task AddAsync(Course course, CancellationToken ct = default) => db.Courses.AddAsync(course, ct).AsTask();

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (course is not null)
        {
            db.Courses.Remove(course);
            await db.SaveChangesAsync(ct);
        }
    }

    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
