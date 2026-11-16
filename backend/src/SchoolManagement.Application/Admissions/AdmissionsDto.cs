using SchoolManagement.Domain.Admissions;

namespace SchoolManagement.Application.Admissions;

public sealed record CreateAdmissionRequest(
    Guid ApplicantId,
    Guid ProgrammeId,
    Guid AcademicYearId,
    Guid IntakeId);

public sealed record UpdateAdmissionRequest(
    Guid Id,
    AdmissionStatus? Status = null);

public sealed record DecideAdmissionRequest(
    AdmissionStatus Decision,
    string? Reason,
    string? DecidedBy);

public sealed record AdmissionDto(
    Guid Id,
    Guid ApplicantId,
    Guid ProgrammeId,
    Guid AcademicYearId,
    Guid IntakeId,
    AdmissionStatus Status,
    DateTimeOffset? DecidedAt);

public sealed record AdmissionDecisionDto(
    Guid Id,
    Guid AdmissionId,
    AdmissionStatus Decision,
    string? Reason,
    string? DecidedBy);
