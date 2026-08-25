using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Certificates;

public sealed class CertificateService(
    ICertificateRepository repository,
    SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext db) : ICertificateRepository
{
    public async Task<Certificate?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await repository.GetByIdAsync(id, cancellationToken);

    public async Task<IReadOnlyList<Certificate>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await repository.GetByStudentIdAsync(studentId, cancellationToken);

    public async Task AddAsync(Certificate certificate, CancellationToken cancellationToken = default) =>
        await repository.AddAsync(certificate, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        repository.SaveChangesAsync(cancellationToken);

    public async Task<CertificateDto> GenerateAsync(GenerateCertificateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.StudentId, cancellationToken);
        if (student is null) throw new InvalidOperationException("Student not found.");

        var serialNumber = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N"[..8].ToUpperInvariant()}";
        var certificate = new Certificate
        {
            StudentId = request.StudentId,
            Name = $"{student.FirstName} {student.LastName}".Trim(),
            Programme = request.Programme,
            AwardType = request.AwardType,
            GraduationDate = request.GraduationDate,
            SerialNumber = serialNumber,
            IssuedBy = request.IssuedBy,
            IssuedAt = DateTimeOffset.UtcNow
        };

        await AddAsync(certificate, cancellationToken);
        await SaveChangesAsync(cancellationToken);

        return new CertificateDto(
            certificate.Id,
            certificate.StudentId,
            certificate.Name,
            certificate.Programme,
            certificate.AwardType,
            certificate.GraduationDate,
            certificate.SerialNumber,
            certificate.IssuedAt,
            certificate.IssuedBy);
    }
}
