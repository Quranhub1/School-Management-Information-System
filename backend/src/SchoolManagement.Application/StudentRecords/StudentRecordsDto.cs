namespace SchoolManagement.Application.StudentRecords;

public sealed record StudentRecordDto(
    Guid Id,
    string StudentNumber,
    string FirstName,
    string LastName,
    string? OtherNames,
    DateOnly? DateOfBirth,
    string? Gender,
    string? NationalId,
    string? PhoneNumber,
    string? Email,
    string Status,
    IReadOnlyList<StudentGuardianDto> Guardians);

public sealed record StudentGuardianDto(
    Guid Id,
    Guid StudentId,
    string FullName,
    string? Relationship,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary);

public sealed record AddStudentGuardianRequest(
    string FullName,
    string? Relationship,
    string? PhoneNumber,
    string? Email,
    bool IsPrimary = false);
