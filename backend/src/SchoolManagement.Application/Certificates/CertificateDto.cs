namespace SchoolManagement.Application.Certificates;

public sealed record CertificateDto(
    Guid Id,
    Guid StudentId,
    string Name,
    string Programme,
    string AwardType,
    DateOnly GraduationDate,
    string SerialNumber,
    DateTimeOffset IssuedAt,
    string IssuedBy);

public sealed record GenerateCertificateRequest(
    Guid StudentId,
    string Programme,
    string AwardType,
    DateOnly GraduationDate,
    string IssuedBy);
