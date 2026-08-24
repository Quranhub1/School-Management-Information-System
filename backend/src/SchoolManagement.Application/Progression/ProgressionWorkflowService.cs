using SchoolManagement.Domain.Progression;

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

    public async Task<SemesterProgressionDecision> DecideAndRecordAsync(
        Guid studentId,
        Guid fromSemesterId,
        Guid? toSemesterId,
        decimal passRate,
        ProgressionRule rule,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        if (await _repository.ExistsAsync(studentId, fromSemesterId, cancellationToken))
            throw new InvalidOperationException("A progression decision already exists for this student and semester.");

        var decision = _decisionService.Decide(studentId, fromSemesterId, toSemesterId, passRate, rule, reason);
        await _repository.AddAsync(decision, cancellationToken);
        return decision;
    }
}
