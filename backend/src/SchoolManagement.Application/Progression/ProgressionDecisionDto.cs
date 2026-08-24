using SchoolManagement.Domain.Progression;

namespace SchoolManagement.Application.Progression;

public sealed record ProgressionDecisionDto(
    Guid StudentId,
    Guid FromSemesterId,
    Guid? ToSemesterId,
    ProgressionOutcome Outcome,
    decimal PassRate,
    string? Reason);
