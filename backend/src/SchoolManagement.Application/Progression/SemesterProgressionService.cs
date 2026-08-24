using SchoolManagement.Domain.Progression;

namespace SchoolManagement.Application.Progression;

public sealed record ProgressionRule(decimal MinimumPassRate, bool AllowConditional);

public interface ISemesterProgressionService
{
    SemesterProgressionDecision Decide(Guid studentId, Guid fromSemesterId, Guid? toSemesterId,
        decimal passRate, ProgressionRule rule, string? reason = null);
}

public sealed class SemesterProgressionService : ISemesterProgressionService
{
    public SemesterProgressionDecision Decide(Guid studentId, Guid fromSemesterId, Guid? toSemesterId,
        decimal passRate, ProgressionRule rule, string? reason = null)
    {
        if (passRate >= rule.MinimumPassRate)
            return new(studentId, fromSemesterId, toSemesterId, ProgressionOutcome.Promoted, passRate, reason);

        var outcome = rule.AllowConditional ? ProgressionOutcome.Conditional : ProgressionOutcome.Repeat;
        return new(studentId, fromSemesterId, outcome == ProgressionOutcome.Promoted ? toSemesterId : null,
            outcome, passRate, reason);
    }
}