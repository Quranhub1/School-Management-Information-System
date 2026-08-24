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

        var existing = await promotions.GetBySourcePeriodAsync(studentId, fromAcademicYearId, fromSemesterId, cancellationToken);
        if (existing is not null)
            throw new InvalidOperationException("A promotion decision already exists for this student and source academic period.");

        var sourceEntries = transcript.Where(x =>
            x.StudentId == studentId &&
            x.AcademicYearId == fromAcademicYearId &&
            x.SemesterId == fromSemesterId).ToList();

        var missedCount = sourceEntries.Count(x => x.Status == TranscriptStatus.Missed);
        var failedCount = sourceEntries.Count(x => x.Status != TranscriptStatus.Missed && !x.IsPass);

        var status = missedCount > 0
            ? PromotionStatus.PromotedWithOutstandingPapers
            : failedCount > 0
                ? PromotionStatus.AcademicReview
                : PromotionStatus.Promoted;

        var reason = missedCount > 0
            ? $"Progression recorded with {missedCount} outstanding missed paper(s) recorded as X."
            : failedCount > 0
                ? $"Progression requires academic review because {failedCount} source-semester result(s) are not passed."
                : "Source semester results contain no outstanding missed or failed papers.";

        var promotion = new StudentPromotion
        {
            StudentId = studentId,
            FromAcademicYearId = fromAcademicYearId,
            FromSemesterId = fromSemesterId,
            ToAcademicYearId = toAcademicYearId,
            ToSemesterId = toSemesterId,
            Status = status,
            OutstandingPaperCount = missedCount,
            Reason = reason,
            RecordedBy = recordedBy
        };

        await promotions.AddAsync(promotion, cancellationToken);
        await promotions.SaveChangesAsync(cancellationToken);
        return promotion;
    }
}
