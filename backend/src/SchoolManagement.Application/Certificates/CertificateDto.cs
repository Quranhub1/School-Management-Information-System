namespace SchoolManagement.Application.Certificates;

public sealed record CertificateDto(
    Guid Id,
    Guid StudentId,
    string Name,
    string Programme,
    string AwardType,
    DateOnly GraduationDate,
    string SerialNumber,
    string VerificationHash,
    DateTimeOffset IssuedAt,
    string IssuedBy,
    bool IsRevoked,
    DateTimeOffset? RevokedAt,
    string? RevokedBy,
    string? RevocationReason);

public sealed record GenerateCertificateRequest(
    Guid StudentId,
    string Programme,
    string AwardType,
    DateOnly GraduationDate,
    string IssuedBy);
