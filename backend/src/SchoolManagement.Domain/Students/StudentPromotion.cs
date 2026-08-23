namespace SchoolManagement.Domain.Students;

public sealed class StudentPromotion
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid FromAcademicYearId { get; init; }
    public Guid FromSemesterId { get; init; }
    public Guid ToAcademicYearId { get; init; }
    public Guid ToSemesterId { get; init; }
    public PromotionStatus Status { get; init; }
    public int OutstandingPaperCount { get; init; }
    public string? Reason { get; init; }
    public DateTimeOffset RecordedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? RecordedBy { get; init; }
}
