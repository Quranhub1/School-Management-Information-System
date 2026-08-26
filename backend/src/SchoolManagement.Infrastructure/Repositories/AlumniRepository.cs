using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Alumni;
using AlumniEntity = SchoolManagement.Domain.Students.Alumni;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AlumniRepository(SchoolManagementDbContext db) : IAlumniRepository
{
    public async Task<IReadOnlyList<AlumniEntity>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await db.Alumni.AsNoTracking().Where(x => x.IsActive).OrderByDescending(x => x.GraduationDate).ToListAsync(cancellationToken);

    public Task<AlumniEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Alumni.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<AlumniEntity?> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.Alumni.SingleOrDefaultAsync(x => x.StudentId == studentId, cancellationToken);

    public async Task AddAsync(AlumniEntity alumni, CancellationToken cancellationToken = default) =>
        await db.Alumni.AddAsync(alumni, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
