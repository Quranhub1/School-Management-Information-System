namespace SchoolManagement.Application.Students;

public sealed record StudentDto(
    Guid Id,
    string StudentNumber,
    string FirstName,
    string LastName,
    string? OtherNames,
    string DisplayName,
    DateOnly? DateOfBirth,
    string? Gender,
    string? NationalId,
    string? PhoneNumber,
    string? Email,
    string Status,
    bool IsArchived,
    DateTimeOffset? ArchivedAt,
    string? ArchivedBy,
    string? ArchiveReason,
    string? StatusBeforeArchive,
    Guid? AdmissionId,
    Guid? CampusId,
    DateTimeOffset CreatedAt);
