using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class SemesterGpaCalculatorTests
{
    [Fact]
    public void CalculateSemester_UsesCreditUnitWeighting()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 5m, 4, true),
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 3m, 2, true)
        };

        var result = SemesterGpaCalculator.CalculateSemester(results);

        Assert.Equal(26m, result.QualityPoints);
        Assert.Equal(6, result.CreditUnits);
        Assert.Equal(4.33m, result.Gpa);
    }

    [Fact]
    public void CalculateSemester_IgnoresNonFinalResults()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 5m, 3, true),
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 0m, 3, false)
        };

        var result = SemesterGpaCalculator.CalculateSemester(results);

        Assert.Equal(15m, result.QualityPoints);
        Assert.Equal(3, result.CreditUnits);
        Assert.Equal(5m, result.Gpa);
    }

    [Fact]
    public void CalculateCumulative_UsesTotalQualityPointsAcrossSemesters()
    {
        var result = SemesterGpaCalculator.CalculateCumulative(
            new[]
            {
                new SemesterGpaCalculator.GpaResult(80m, 20, 4m),
                new SemesterGpaCalculator.GpaResult(120m, 40, 3m)
            });

        Assert.Equal(200m, result.QualityPoints);
        Assert.Equal(60, result.CreditUnits);
        Assert.Equal(3.33m, result.Gpa);
    }

    [Fact]
    public void CalculateSemester_RejectsNonPositiveCreditUnits()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 5m, 0, true)
        };

        Assert.Throws<InvalidOperationException>(() => SemesterGpaCalculator.CalculateSemester(results));
    }
}
