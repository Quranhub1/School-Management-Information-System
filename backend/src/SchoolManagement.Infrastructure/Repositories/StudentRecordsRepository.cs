using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.StudentRecords;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class StudentRecordsRepository(SchoolManagementDbContext db) : IStudentRecordsRepository
{
    public Task<Student?> GetStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == studentId, cancellationToken);

    public async Task<IReadOnlyList<StudentGuardian>> GetGuardiansAsync(
        Guid studentId,
        CancellationToken cancellationToken = default) =>
        await db.StudentGuardians
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IsPrimary)
            .ThenBy(x => x.FullName)
            .ToListAsync(cancellationToken);

    public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, cancellationToken);

    public async Task AddGuardianAsync(StudentGuardian guardian, CancellationToken cancellationToken = default) =>
        await db.StudentGuardians.AddAsync(guardian, cancellationToken);

    public Task<StudentGuardian?> GetGuardianAsync(
        Guid studentId,
        Guid guardianId,
        CancellationToken cancellationToken = default) =>
        db.StudentGuardians.SingleOrDefaultAsync(
            x => x.StudentId == studentId && x.Id == guardianId,
            cancellationToken);

    public void RemoveGuardian(StudentGuardian guardian) => db.StudentGuardians.Remove(guardian);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
