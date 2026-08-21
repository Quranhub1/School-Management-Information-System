using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class AssessmentResultCalculatorTests
{
    [Fact]
    public void Calculate_UsesAssessmentWeights()
    {
        var scale = new GradingScale { Id = Guid.NewGuid(), Name = "Configurable Uganda Scale", IsActive = true };
        var band = new GradeBand { Id = Guid.NewGuid(), GradingScaleId = scale.Id, Grade = "A", MinimumScore = 80m, MaximumScore = 100m, GradePoint = 5m, IsPass = true };

        var assessments = new[]
        {
            new StudentAssessment { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), AssessmentPlanId = Guid.NewGuid(), Score = 80m, MaximumScore = 100m, IsFinal = true },
            new StudentAssessment { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), AssessmentPlanId = Guid.NewGuid(), Score = 90m, MaximumScore = 100m, IsFinal = true }
        };

        var plans = new[]
        {
            new AssessmentPlan { Id = assessments[0].AssessmentPlanId, WeightPercentage = 40m },
            new AssessmentPlan { Id = assessments[1].AssessmentPlanId, WeightPercentage = 60m }
        };

        var result = AssessmentResultCalculator.Calculate(
            assessments,
            plans,
            scale,
            new[] { band },
            Guid.NewGuid());

        Assert.Equal(86m, result.TotalScore);
        Assert.Equal("A", result.Grade);
        Assert.Equal(5m, result.GradePoint);
        Assert.True(result.IsFinal);
        Assert.NotNull(result.FinalizedAt);
    }
}
