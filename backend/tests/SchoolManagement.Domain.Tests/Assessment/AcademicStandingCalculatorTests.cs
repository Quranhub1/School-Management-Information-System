using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class AcademicStandingCalculatorTests
{
    private static readonly Guid StudentId = Guid.NewGuid();

    [Theory]
    [InlineData(3.5, 3.2, AcademicStandingStatus.GoodStanding, true)]
    [InlineData(1.8, 2.2, AcademicStandingStatus.AcademicWarning, true)]
    [InlineData(1.7, 1.8, AcademicStandingStatus.Probation, false)]
    [InlineData(1.2, 1.4, AcademicStandingStatus.Discontinued, false)]
    public void Determine_ReturnsExpectedStanding(decimal gpa, decimal cgpa, AcademicStandingStatus expected, bool eligible)
    {
        var result = AcademicStandingCalculator.Determine(StudentId, gpa, cgpa);

        Assert.Equal(expected, result.Status);
        Assert.Equal(eligible, result.EligibleToProgress);
        Assert.Equal(gpa, result.Gpa);
        Assert.Equal(cgpa, result.Cgpa);
        Assert.NotEqual(default, result.DeterminedAt);
    }

    [Fact]
    public void Determine_RejectsNegativeGpa()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            AcademicStandingCalculator.Determine(StudentId, -1m, 2m));
    }

    [Fact]
    public void Determine_RejectsInvalidThresholdOrder()
    {
        Assert.Throws<ArgumentException>(() =>
            AcademicStandingCalculator.Determine(StudentId, 2m, 2m, 1m, 1.5m));
    }
}
