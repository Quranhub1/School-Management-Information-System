using System.Security.Cryptography;
using System.Text;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Certificates;

public sealed class CertificateService(ICertificateRepository repository, IStudentRepository studentRepository)
{
    public Task<Certificate?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => repository.GetByIdAsync(id, cancellationToken);

    public async Task<CertificateDto> GenerateAsync(GenerateCertificateRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var student = await studentRepository.GetByIdAsync(request.StudentId, cancellationToken);
        if (student is null) throw new InvalidOperationException("Student not found.");

        var serialNumber = $"CERT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        var hashData = $"{serialNumber}{request.StudentId}{DateTimeOffset.UtcNow:O}{request.IssuedBy}";
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(hashData));
        var verificationHash = Convert.ToHexString(hashBytes).ToUpperInvariant();

        var certificate = new Certificate
        {
            StudentId = request.StudentId,
            Name = $"{student.FirstName} {student.LastName}".Trim(),
            Programme = request.Programme,
            AwardType = request.AwardType,
            GraduationDate = request.GraduationDate,
            SerialNumber = serialNumber,
            VerificationHash = verificationHash,
            IssuedBy = request.IssuedBy,
            IssuedAt = DateTimeOffset.UtcNow
        };

        await repository.AddAsync(certificate, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return new CertificateDto(certificate.Id, certificate.StudentId, certificate.Name, certificate.Programme, certificate.AwardType, certificate.GraduationDate, certificate.SerialNumber, certificate.VerificationHash, certificate.IssuedAt, certificate.IssuedBy, certificate.IsRevoked, certificate.RevokedAt, certificate.RevokedBy, certificate.RevocationReason);
    }

    public async Task RevokeAsync(Guid certificateId, string revokedBy, string? reason, CancellationToken cancellationToken = default)
    {
        var certificate = await repository.GetByIdAsync(certificateId, cancellationToken);
        if (certificate is null) throw new InvalidOperationException("Certificate not found.");
        if (certificate.IsRevoked) throw new InvalidOperationException("Certificate is already revoked.");

        certificate.IsRevoked = true;
        certificate.RevokedAt = DateTimeOffset.UtcNow;
        certificate.RevokedBy = revokedBy;
        certificate.RevocationReason = reason;

        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<CertificateDto?> VerifyAsync(string serialNumber, CancellationToken cancellationToken = default)
    {
        var certificate = await repository.GetBySerialNumberAsync(serialNumber, cancellationToken);
        if (certificate is null) return null;

        return new CertificateDto(certificate.Id, certificate.StudentId, certificate.Name, certificate.Programme, certificate.AwardType, certificate.GraduationDate, certificate.SerialNumber, certificate.VerificationHash, certificate.IssuedAt, certificate.IssuedBy, certificate.IsRevoked, certificate.RevokedAt, certificate.RevokedBy, certificate.RevocationReason);
    }
}
