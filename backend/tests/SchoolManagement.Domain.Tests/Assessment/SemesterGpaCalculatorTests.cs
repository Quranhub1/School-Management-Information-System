using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class SemesterGpaCalculatorTests
{
    [Fact]
    public void CalculateSemesterGpa_UsesCreditUnitWeighting()
    {
        var course1 = Guid.NewGuid();
        var course2 = Guid.NewGuid();
        var results = new[]
        {
            new AssessmentResult { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), CourseId = course1, TotalScore = 80m, Grade = "A", GradePoint = 5m, IsFinal = true },
            new AssessmentResult { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), CourseId = course2, TotalScore = 60m, Grade = "B", GradePoint = 3m, IsFinal = true }
        };
        var courses = new[]
        {
            new Course { Id = course1, Code = "C1", Name = "Course 1", CreditUnits = 4 },
            new Course { Id = course2, Code = "C2", Name = "Course 2", CreditUnits = 2 }
        };

        var gpa = SemesterGpaCalculator.CalculateGpa(results, courses);

        Assert.Equal(4.33m, gpa);
    }

    [Fact]
    public void CalculateGpa_IgnoresNonFinalResults()
    {
        var course = Guid.NewGuid();
        var results = new[]
        {
            new AssessmentResult { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), CourseId = course, TotalScore = 80m, Grade = "A", GradePoint = 5m, IsFinal = true },
            new AssessmentResult { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), CourseId = course, TotalScore = 20m, Grade = "F", GradePoint = 0m, IsFinal = false }
        };
        var courses = new[] { new Course { Id = course, Code = "C1", Name = "Course 1", CreditUnits = 3 } };

        var gpa = SemesterGpaCalculator.CalculateGpa(results, courses);

        Assert.Equal(5m, gpa);
    }

    [Fact]
    public void CalculateCgpa_UsesTotalQualityPointsAcrossSemesters()
    {
        var cgpa = SemesterGpaCalculator.CalculateCgpa(
            new[] { (4m, 20), (3m, 40) });

        Assert.Equal(3.33m, cgpa);
    }

    [Fact]
    public void CalculateGpa_RejectsNonPositiveCreditUnits()
    {
        var course = Guid.NewGuid();
        var results = new[]
        {
            new AssessmentResult { Id = Guid.NewGuid(), StudentId = Guid.NewGuid(), CourseId = course, TotalScore = 80m, Grade = "A", GradePoint = 5m, IsFinal = true }
        };
        var courses = new[] { new Course { Id = course, Code = "C1", Name = "Course 1", CreditUnits = 0 } };

        Assert.Throws<ArgumentException>(() => SemesterGpaCalculator.CalculateGpa(results, courses));
    }
}
