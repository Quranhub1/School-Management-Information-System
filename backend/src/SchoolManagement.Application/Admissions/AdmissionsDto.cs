namespace SchoolManagement.Application.Admissions;

public sealed record CreateAdmissionRequest(
    Guid ApplicantId,
    Guid ProgrammeId,
    Guid AcademicYearId,
    Guid IntakeId);

public sealed record DecideAdmissionRequest(
    string Decision,
    string? Reason,
    string? DecidedBy);

public sealed record AdmissionDto(
    Guid Id,
    Guid ApplicantId,
    Guid ProgrammeId,
    Guid AcademicYearId,
    Guid IntakeId,
    string Status,
    DateTimeOffset? DecidedAt);

public sealed record AdmissionDecisionDto(
    Guid Id,
    Guid AdmissionId,
    string Decision,
    string? Reason,
    string? DecidedBy);
