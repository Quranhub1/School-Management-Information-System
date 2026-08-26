using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Certificates;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Certificates;

public sealed class CertificateService(ICertificateRepository repository, SchoolManagementDbContext db) : ICertificateRepository
{
    public Task<Certificate?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => repository.GetByIdAsync(id, cancellationToken);
    public Task<IReadOnlyList<Certificate>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default) => repository.GetByStudentIdAsync(studentId, cancellationToken);
    public Task AddAsync(Certificate certificate, CancellationToken cancellationToken = default) => repository.AddAsync(certificate, cancellationToken);
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => repository.SaveChangesAsync(cancellationToken);

    public async Task<CertificateDto> GenerateAsync(GenerateCertificateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.StudentId, cancellationToken);
        if (student is null) throw new InvalidOperationException("Student not found.");
        var certificate = new Certificate
        {
            StudentId = request.StudentId,
            Name = $"{student.FirstName} {student.LastName}".Trim(),
            Programme = request.Programme,
            AwardType = request.AwardType,
            GraduationDate = request.GraduationDate,
            SerialNumber = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            IssuedBy = request.IssuedBy,
            IssuedAt = DateTimeOffset.UtcNow
        };
        await repository.AddAsync(certificate, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new CertificateDto(certificate.Id, certificate.StudentId, certificate.Name, certificate.Programme, certificate.AwardType, certificate.GraduationDate, certificate.SerialNumber, certificate.IssuedAt, certificate.IssuedBy);
    }
}
