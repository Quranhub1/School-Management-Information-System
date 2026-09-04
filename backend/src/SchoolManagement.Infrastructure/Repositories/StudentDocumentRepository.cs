using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Documents;
using SchoolManagement.Infrastructure.Documents;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class StudentDocumentRepository(SchoolManagementDbContext db) : IStudentDocumentRepository
{
    public Task<StudentDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StudentDocuments.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<IReadOnlyList<StudentDocument>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.StudentDocuments.AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.UploadedAt).ToListAsync(cancellationToken).ContinueWith(t => (IReadOnlyList<StudentDocument>)t.Result, cancellationToken);

    public async Task AddAsync(StudentDocument document, CancellationToken cancellationToken = default) =>
        await db.StudentDocuments.AddAsync(document, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
