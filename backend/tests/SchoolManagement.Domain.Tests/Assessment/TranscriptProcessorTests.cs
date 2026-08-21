using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class TranscriptProcessorTests
{
    [Fact]
    public void Generate_CreatesEntryFromFinalizedResult()
    {
        var studentId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var academicYearId = Guid.NewGuid();
        var semesterId = Guid.NewGuid();

        var registration = new CourseRegistration
        {
            Id = registrationId,
            StudentId = studentId,
            CourseId = courseId,
            SemesterId = semesterId,
            Status = "Registered"
        };
        var course = new Course { Id = courseId, Code = "PHM101", Name = "Introduction to Pharmacy", CreditUnits = 4 };
        var result = new AssessmentResult
        {
            StudentId = studentId,
            CourseRegistrationId = registrationId,
            CourseId = courseId,
            TotalScore = 82m,
            Grade = "A",
            GradePoint = 5m,
            IsFinal = true,
            FinalizedAt = DateTimeOffset.UtcNow
        };

        var entries = TranscriptProcessor.Generate(new[] { result }, new[] { registration }, new[] { course }, academicYearId, semesterId);

        var entry = Assert.Single(entries);
        Assert.Equal(studentId, entry.StudentId);
        Assert.Equal("PHM101", entry.CourseCode);
        Assert.Equal("Introduction to Pharmacy", entry.CourseTitle);
        Assert.Equal(4m, entry.CreditUnits);
        Assert.Equal(82m, entry.Score);
        Assert.Equal("A", entry.Grade);
        Assert.Equal(5m, entry.GradePoint);
        Assert.True(entry.IsPass);
        Assert.Equal(academicYearId, entry.AcademicYearId);
        Assert.Equal(semesterId, entry.SemesterId);
    }

    [Fact]
    public void Generate_IgnoresNonFinalResults()
    {
        var studentId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var semesterId = Guid.NewGuid();

        var registration = new CourseRegistration
        {
            Id = registrationId, StudentId = studentId, CourseId = courseId,
            SemesterId = semesterId, Status = "Registered"
        };
        var course = new Course { Id = courseId, Code = "PHM102", Name = "Pharmaceutics", CreditUnits = 3 };
        var result = new AssessmentResult
        {
            StudentId = studentId, CourseRegistrationId = registrationId, CourseId = courseId,
            TotalScore = 60m, Grade = "C", GradePoint = 3m, IsFinal = false
        };

        var entries = TranscriptProcessor.Generate(new[] { result }, new[] { registration }, new[] { course }, Guid.NewGuid(), semesterId);

        Assert.Empty(entries);
    }

    [Fact]
    public void Generate_IgnoresResultsFromAnotherSemester()
    {
        var studentId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var registrationSemesterId = Guid.NewGuid();
        var requestedSemesterId = Guid.NewGuid();

        var registration = new CourseRegistration
        {
            Id = registrationId, StudentId = studentId, CourseId = courseId,
            SemesterId = registrationSemesterId, Status = "Registered"
        };
        var course = new Course { Id = courseId, Code = "PHM103", Name = "Pharmacology", CreditUnits = 4 };
        var result = new AssessmentResult
        {
            StudentId = studentId, CourseRegistrationId = registrationId, CourseId = courseId,
            TotalScore = 75m, Grade = "B", GradePoint = 4m, IsFinal = true
        };

        var entries = TranscriptProcessor.Generate(new[] { result }, new[] { registration }, new[] { course }, Guid.NewGuid(), requestedSemesterId);

        Assert.Empty(entries);
    }

    [Fact]
    public void Generate_RejectsResultForDifferentStudent()
    {
        var studentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var semesterId = Guid.NewGuid();

        var registration = new CourseRegistration
        {
            Id = registrationId, StudentId = studentId, CourseId = courseId,
            SemesterId = semesterId, Status = "Registered"
        };
        var course = new Course { Id = courseId, Code = "PHM104", Name = "Clinical Pharmacy", CreditUnits = 3 };
        var result = new AssessmentResult
        {
            StudentId = otherStudentId, CourseRegistrationId = registrationId, CourseId = courseId,
            TotalScore = 88m, Grade = "A", GradePoint = 5m, IsFinal = true
        };

        Assert.Throws<InvalidOperationException>(() =>
            TranscriptProcessor.Generate(new[] { result }, new[] { registration }, new[] { course }, Guid.NewGuid(), semesterId));
    }
}
