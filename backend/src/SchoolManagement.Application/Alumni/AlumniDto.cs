namespace SchoolManagement.Application.Alumni;

public sealed record AlumniDto(
    Guid Id,
    Guid StudentId,
    DateOnly GraduationDate,
    string Programme,
    string? CurrentOccupation,
    string? Employer,
    string? ContactInfo,
    bool IsActive);
