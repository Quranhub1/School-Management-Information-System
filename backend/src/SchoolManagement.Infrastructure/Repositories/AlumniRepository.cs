using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Alumni;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AlumniRepository(SchoolManagementDbContext db) : IAlumniRepository
{
    public async Task<IReadOnlyList<Alumni>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await db.Alumni.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.GraduationDate).ToListAsync(cancellationToken);

    public Task<Alumni?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Alumni.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<Alumni?> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.Alumni.SingleOrDefaultAsync(x => x.StudentId == studentId, cancellationToken);

    public async Task AddAsync(Alumni alumni, CancellationToken cancellationToken = default) => await db.Alumni.AddAsync(alumni, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
