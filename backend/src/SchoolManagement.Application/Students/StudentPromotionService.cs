using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Students;

public sealed class StudentPromotionService(IStudentPromotionRepository promotions)
{
    public async Task<StudentPromotion> PromoteAsync(
        Guid studentId,
        Guid fromAcademicYearId,
        Guid fromSemesterId,
        Guid toAcademicYearId,
        Guid toSemesterId,
        IReadOnlyCollection<TranscriptEntry> transcript,
        string? recordedBy = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transcript);

        if (fromAcademicYearId == toAcademicYearId && fromSemesterId == toSemesterId)
            throw new ArgumentException("Source and destination academic periods must differ.");

        var existing = await promotions.GetBySourcePeriodAsync(
            studentId, fromAcademicYearId, fromSemesterId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("A promotion decision already exists for this student and source academic period.");

        var missedCount = transcript.Count(x =>
            x.StudentId == studentId && x.Status == TranscriptStatus.Missed);

        var status = missedCount > 0
            ? PromotionStatus.PromotedWithOutstandingPapers
            : PromotionStatus.Promoted;

        var promotion = new StudentPromotion
        {
            StudentId = studentId,
            FromAcademicYearId = fromAcademicYearId,
            FromSemesterId = fromSemesterId,
            ToAcademicYearId = toAcademicYearId,
            ToSemesterId = toSemesterId,
            Status = status,
            OutstandingPaperCount = missedCount,
            Reason = missedCount > 0
                ? $"Promotion requires tracking {missedCount} outstanding missed paper(s) recorded as X."
                : "No outstanding missed papers were found.",
            RecordedBy = recordedBy
        };

        await promotions.AddAsync(promotion, cancellationToken);
        await promotions.SaveChangesAsync(cancellationToken);
        return promotion;
    }

    public async Task<PromotionAssessment> AssessAsync(
        Guid studentId,
        Guid fromAcademicYearId,
        Guid fromSemesterId,
        Guid toAcademicYearId,
        Guid toSemesterId,
        IReadOnlyCollection<TranscriptEntry> transcript,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transcript);
        if (fromAcademicYearId == toAcademicYearId && fromSemesterId == toSemesterId)
            throw new ArgumentException("Source and destination academic periods must differ.");

        var missedCount = transcript.Count(x =>
            x.StudentId == studentId && x.Status == TranscriptStatus.Missed);

        return new PromotionAssessment
        {
            StudentId = studentId,
            FromAcademicYearId = fromAcademicYearId,
            FromSemesterId = fromSemesterId,
            ToAcademicYearId = toAcademicYearId,
            ToSemesterId = toSemesterId,
            Status = missedCount > 0 ? PromotionStatus.PromotedWithOutstandingPapers : PromotionStatus.Promoted,
            OutstandingPaperCount = missedCount,
            Reason = missedCount > 0
                ? $"Promotion requires tracking {missedCount} outstanding missed paper(s) recorded as X."
                : "No outstanding missed papers were found."
        };
    }
}

public sealed class PromotionAssessment
{
    public Guid StudentId { get; init; }
    public Guid FromAcademicYearId { get; init; }
    public Guid FromSemesterId { get; init; }
    public Guid ToAcademicYearId { get; init; }
    public Guid ToSemesterId { get; init; }
    public PromotionStatus Status { get; init; }
    public int OutstandingPaperCount { get; init; }
    public string Reason { get; init; } = string.Empty;
}
