using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class StudentRepository(SchoolManagementDbContext db) : IStudentRepository
{
    public async Task<IReadOnlyList<Student>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Students.AsNoTracking().OrderBy(x => x.StudentNumber).ToListAsync(cancellationToken);

    public Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(Student student, CancellationToken cancellationToken = default) =>
        await db.Students.AddAsync(student, cancellationToken);

    public async Task UpdateAsync(Student student, CancellationToken cancellationToken = default)
    {
        db.Students.Update(student);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var student = await db.Students.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (student is null) return;
        db.Students.Remove(student);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
