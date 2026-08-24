using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Progression;

public sealed class ProgressionWorkflowService
{
    private readonly ISemesterProgressionRepository _repository;
    private readonly ISemesterProgressionService _decisionService;

    public ProgressionWorkflowService(ISemesterProgressionRepository repository, ISemesterProgressionService decisionService)
    {
        _repository = repository;
        _decisionService = decisionService;
    }

    public async Task<StudentPromotion> DecideAndRecordAsync(
        Guid studentId, Guid fromAcademicYearId, Guid fromSemesterId,
        Guid toAcademicYearId, Guid toSemesterId, decimal passRate,
        int outstandingPaperCount, ProgressionRule rule, string? reason = null,
        string? recordedBy = null, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty || fromAcademicYearId == Guid.Empty || fromSemesterId == Guid.Empty ||
            toAcademicYearId == Guid.Empty || toSemesterId == Guid.Empty)
            throw new ArgumentException("All academic and student identifiers are required.");
        if (outstandingPaperCount < 0) throw new ArgumentOutOfRangeException(nameof(outstandingPaperCount));
        if (await _repository.ExistsAsync(studentId, fromSemesterId, cancellationToken))
            throw new InvalidOperationException("A progression decision already exists for this student and semester.");

        var status = _decisionService.Decide(passRate, rule);
        var promotion = new StudentPromotion
        {
            StudentId = studentId, FromAcademicYearId = fromAcademicYearId, FromSemesterId = fromSemesterId,
            ToAcademicYearId = toAcademicYearId, ToSemesterId = toSemesterId, Status = status,
            OutstandingPaperCount = status == PromotionStatus.PromotedWithOutstandingPapers ? outstandingPaperCount : 0,
            Reason = reason, RecordedBy = recordedBy
        };
        await _repository.AddAsync(promotion, cancellationToken);
        return promotion;
    }
}
