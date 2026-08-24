using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Progression;

public sealed record ProgressionDecisionDto(
    Guid StudentId,
    Guid FromSemesterId,
    Guid ToSemesterId,
    PromotionStatus Status,
    int OutstandingPaperCount,
    string? Reason);
