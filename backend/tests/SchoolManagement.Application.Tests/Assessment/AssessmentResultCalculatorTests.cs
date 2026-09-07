using ApplicationAssessmentResultCalculator = SchoolManagement.Application.Assessment.AssessmentResultCalculator;
using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Application.Tests.Assessment;

public sealed class AssessmentResultCalculatorTests
{
    [Fact]
    public void Calculate_UsesAssessmentWeights()
    {
        var studentId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var plan1Id = Guid.NewGuid();
        var plan2Id = Guid.NewGuid();
        var scaleId = Guid.NewGuid();

        var assessments = new[]
        {
            new StudentAssessment
            {
                Id = Guid.NewGuid(), StudentId = studentId, CourseRegistrationId = registrationId,
                AssessmentPlanId = plan1Id, Score = 80m, MaximumScore = 100m, IsFinalized = true
            },
            new StudentAssessment
            {
                Id = Guid.NewGuid(), StudentId = studentId, CourseRegistrationId = registrationId,
                AssessmentPlanId = plan2Id, Score = 90m, MaximumScore = 100m, IsFinalized = true
            }
        };

        var plans = new[]
        {
            new AssessmentPlan { Id = plan1Id, CourseId = courseId, Name = "Coursework", AssessmentType = "Coursework", WeightPercentage = 40m },
            new AssessmentPlan { Id = plan2Id, CourseId = courseId, Name = "Final Examination", AssessmentType = "Examination", WeightPercentage = 60m }
        };

        var gradingScale = new GradingScale { Id = scaleId, Name = "Default" };
        var bands = new[]
        {
            new GradeBand { Id = Guid.NewGuid(), GradingScaleId = scaleId, Grade = "A", MinimumScore = 80m, MaximumScore = 100m, GradePoint = 5m, IsPass = true }
        };

        var calculator = new ApplicationAssessmentResultCalculator();
        var result = calculator.Calculate(studentId, registrationId, assessments, plans, bands);

        Assert.Equal(studentId, result.StudentId);
        Assert.Equal(registrationId, result.CourseRegistrationId);
        Assert.Equal(86m, result.TotalScore);
        Assert.Equal("A", result.Grade);
        Assert.Equal(5m, result.GradePoint);
        Assert.True(result.IsFinal);
        Assert.NotNull(result.FinalizedAt);
    }
}
