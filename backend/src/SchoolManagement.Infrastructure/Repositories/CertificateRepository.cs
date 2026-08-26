using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Certificates;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class CertificateRepository(SchoolManagementDbContext db) : ICertificateRepository
{
    public Task<Certificate?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Certificates.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Certificate>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await db.Certificates.AsNoTracking().Where(x => x.StudentId == studentId).ToListAsync(cancellationToken);

    public async Task AddAsync(Certificate certificate, CancellationToken cancellationToken = default) =>
        await db.Certificates.AddAsync(certificate, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
