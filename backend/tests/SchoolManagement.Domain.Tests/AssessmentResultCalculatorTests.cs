using FluentAssertions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Domain.Tests;

public class AssessmentResultCalculatorTests
{
    private static GradeBand Band(Guid scaleId, string grade, decimal min, decimal max, decimal points, bool pass = true)
        => new()
        {
            GradingScaleId = scaleId,
            Grade = grade,
            MinimumScore = min,
            MaximumScore = max,
            GradePoint = points,
            IsPass = pass
        };

    [Fact]
    public void Calculate_SingleAssessmentWithFullScore_ReturnsTopGrade()
    {
        var scaleId = Guid.NewGuid();
        var bands = new[] { Band(scaleId, "A", 70, 100, 5.0m), Band(scaleId, "B", 60, 69, 4.0m) };
        var plan = new AssessmentPlan
        {
            CourseId = Guid.NewGuid(),
            Name = "Final Exam",
            AssessmentType = "Theory",
            WeightPercentage = 100
        };
        var assessment = new StudentAssessment
        {
            StudentId = Guid.NewGuid(),
            AssessmentPlanId = plan.Id,
            MaximumScore = 100,
            Score = 85,
            IsFinal = true
        };

        var result = AssessmentResultCalculator.Calculate(
            new[] { assessment }, new[] { plan },
            new GradingScale { Id = scaleId }, bands, Guid.NewGuid());

        result.Grade.Should().Be("A");
        result.GradePoint.Should().Be(5.0m);
        result.TotalScore.Should().Be(85.00m);
        result.IsFinal.Should().BeTrue();
    }

    [Fact]
    public void Calculate_MultipleWeightedAssessments_ReturnsWeightedTotal()
    {
        var scaleId = Guid.NewGuid();
        var bands = new[] { Band(scaleId, "A", 70, 100, 5.0m), Band(scaleId, "B", 60, 69, 4.0m) };
        var plan1 = new AssessmentPlan { CourseId = Guid.NewGuid(), Name = "CAT", AssessmentType = "Theory", WeightPercentage = 30 };
        var plan2 = new AssessmentPlan { CourseId = plan1.CourseId, Name = "Final", AssessmentType = "Theory", WeightPercentage = 70 };
        var studentId = Guid.NewGuid();
        var assessments = new[]
        {
            new StudentAssessment { StudentId = studentId, AssessmentPlanId = plan1.Id, MaximumScore = 100, Score = 80, IsFinal = true },
            new StudentAssessment { StudentId = studentId, AssessmentPlanId = plan2.Id, MaximumScore = 100, Score = 60, IsFinal = true }
        };

        var result = AssessmentResultCalculator.Calculate(assessments, new[] { plan1, plan2 },
            new GradingScale { Id = scaleId }, bands, Guid.NewGuid());

        result.TotalScore.Should().Be(66.00m);
        result.Grade.Should().Be("B");
    }

    [Fact]
    public void Calculate_EmptyAssessments_Throws()
    {
        var scaleId = Guid.NewGuid();
        Action act = () => AssessmentResultCalculator.Calculate(
            Array.Empty<StudentAssessment>(),
            Array.Empty<AssessmentPlan>(),
            new GradingScale { Id = scaleId },
            Array.Empty<GradeBand>(),
            Guid.NewGuid());

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Calculate_ZeroWeights_Throws()
    {
        var scaleId = Guid.NewGuid();
        var plan = new AssessmentPlan { CourseId = Guid.NewGuid(), Name = "Test", AssessmentType = "Theory", WeightPercentage = 0 };
        var assessment = new StudentAssessment { StudentId = Guid.NewGuid(), AssessmentPlanId = plan.Id, MaximumScore = 100, Score = 50, IsFinal = true };

        Action act = () => AssessmentResultCalculator.Calculate(new[] { assessment }, new[] { plan },
            new GradingScale { Id = scaleId }, new[] { Band(scaleId, "C", 0, 100, 2.0m) }, Guid.NewGuid());

        act.Should().Throw<InvalidOperationException>();
    }
}
