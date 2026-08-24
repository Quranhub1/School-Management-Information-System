using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Progression;

public sealed record ProgressionRule(decimal MinimumPassRate, bool AllowConditional);

public interface ISemesterProgressionService
{
    PromotionStatus Decide(decimal passRate, ProgressionRule rule);
}

public sealed class SemesterProgressionService : ISemesterProgressionService
{
    public PromotionStatus Decide(decimal passRate, ProgressionRule rule)
    {
        if (passRate < 0 || passRate > 100)
            throw new ArgumentOutOfRangeException(nameof(passRate));
        if (rule.MinimumPassRate is < 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(rule.MinimumPassRate));

        if (passRate >= rule.MinimumPassRate)
            return PromotionStatus.Promoted;

        return rule.AllowConditional
            ? PromotionStatus.PromotedWithOutstandingPapers
            : PromotionStatus.Repeat;
    }
}
