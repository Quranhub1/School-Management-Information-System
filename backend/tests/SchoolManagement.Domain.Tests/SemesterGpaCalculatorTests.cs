using FluentAssertions;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Domain.Tests;

public class SemesterGpaCalculatorTests
{
    [Fact]
    public void CalculateSemester_SingleCourse_ReturnsCorrectGpa()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 4.0m, 3, true)
        };

        var gpa = SemesterGpaCalculator.CalculateSemester(results);

        gpa.Gpa.Should().Be(4.0m);
        gpa.CreditUnits.Should().Be(3);
        gpa.QualityPoints.Should().Be(12.0m);
    }

    [Fact]
    public void CalculateSemester_MultipleCourses_WeightedByCredits()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 5.0m, 4, true),
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 3.0m, 3, true),
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 4.0m, 2, true)
        };

        var gpa = SemesterGpaCalculator.CalculateSemester(results);

        gpa.CreditUnits.Should().Be(9);
        gpa.QualityPoints.Should().Be(37.0m);
        gpa.Gpa.Should().Be(4.11m);
    }

    [Fact]
    public void CalculateSemester_IgnoresNonFinalResults()
    {
        var results = new[]
        {
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 5.0m, 3, true),
            new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 1.0m, 3, false)
        };

        var gpa = SemesterGpaCalculator.CalculateSemester(results);

        gpa.Gpa.Should().Be(5.0m);
        gpa.CreditUnits.Should().Be(3);
    }

    [Fact]
    public void CalculateSemester_EmptyFinalized_Throws()
    {
        Action act = () => SemesterGpaCalculator.CalculateSemester(Array.Empty<SemesterGpaCalculator.CourseResultInput>());
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CalculateSemester_ZeroCredits_Throws()
    {
        var results = new[] { new SemesterGpaCalculator.CourseResultInput(Guid.NewGuid(), 4.0m, 0, true) };
        Action act = () => SemesterGpaCalculator.CalculateSemester(results);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CalculateCumulative_AcrossSemesters_WeightedByCredits()
    {
        var semesters = new[]
        {
            new SemesterGpaCalculator.GpaResult(40m, 10, 4.0m),
            new SemesterGpaCalculator.GpaResult(36m, 12, 3.0m)
        };

        var cgpa = SemesterGpaCalculator.CalculateCumulative(semesters);

        cgpa.CreditUnits.Should().Be(22);
        cgpa.QualityPoints.Should().Be(76.0m);
        cgpa.Gpa.Should().Be(3.45m);
    }

    [Fact]
    public void CalculateCgpa_CreditWeighted_AveragesCorrectly()
    {
        var semesters = new[] { (Gpa: 4.0m, CreditUnits: 4), (Gpa: 3.0m, CreditUnits: 2) };
        var cgpa = SemesterGpaCalculator.CalculateCgpa(semesters);
        cgpa.Should().Be(3.67m);
    }
}
