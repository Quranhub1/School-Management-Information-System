using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class TranscriptRecordBuilderTests
{
    private static readonly Guid StudentId = Guid.NewGuid();

    [Fact]
    public void Build_CreatesUnfinalizedTranscriptWithAcademicSummary()
    {
        var courses = new[]
        {
            new TranscriptCourseRecord
            {
                CourseCode = "PHA101",
                CourseName = "Pharmacy Practice",
                CreditUnits = 4,
                Score = 78m,
                Grade = "A",
                GradePoint = 5m
            }
        };

        var record = TranscriptRecordBuilder.Build(
            StudentId, "KSHS/001/26", "PHC", "Certificate in Pharmacy", "2026/2027",
            courses, 5m, 4.5m, AcademicStandingStatus.GoodStanding);

        Assert.NotEqual(Guid.Empty, record.Id);
        Assert.Equal(StudentId, record.StudentId);
        Assert.Equal("KSHS/001/26", record.StudentNumber);
        Assert.Equal("PHC", record.ProgrammeCode);
        Assert.Single(record.Courses);
        Assert.Equal(5m, record.SemesterGpa);
        Assert.Equal(4.5m, record.Cgpa);
        Assert.Equal(AcademicStandingStatus.GoodStanding, record.AcademicStanding);
        Assert.False(record.IsFinalized);
        Assert.Null(record.FinalizedAt);
    }

    [Fact]
    public void Finalize_SetsFinalizationStateAndTimestamp()
    {
        var record = TranscriptRecordBuilder.Build(
            StudentId, "KSHS/001/26", "PHC", "Certificate in Pharmacy", "2026/2027",
            Array.Empty<TranscriptCourseRecord>(), 0m, 0m, AcademicStandingStatus.GoodStanding);
        var timestamp = new DateTime(2026, 8, 21, 10, 0, 0, DateTimeKind.Utc);

        TranscriptRecordBuilder.Finalize(record, timestamp);

        Assert.True(record.IsFinalized);
        Assert.Equal(timestamp, record.FinalizedAt);
    }

    [Theory]
    [InlineData("", "PHC", "2026/2027")]
    [InlineData("KSHS/001/26", "", "2026/2027")]
    [InlineData("KSHS/001/26", "PHC", "")]
    public void Build_RejectsMissingRequiredIdentity(string studentNumber, string programmeCode, string academicYear)
    {
        Assert.Throws<ArgumentException>(() => TranscriptRecordBuilder.Build(
            StudentId, studentNumber, programmeCode, "Certificate in Pharmacy", academicYear,
            Array.Empty<TranscriptCourseRecord>(), 0m, 0m, AcademicStandingStatus.GoodStanding));
    }

    [Fact]
    public void Build_RejectsNonPositiveCreditUnits()
    {
        var courses = new[]
        {
            new TranscriptCourseRecord { CourseCode = "PHA101", CourseName = "Pharmacy Practice", CreditUnits = 0 }
        };

        Assert.Throws<ArgumentException>(() => TranscriptRecordBuilder.Build(
            StudentId, "KSHS/001/26", "PHC", "Certificate in Pharmacy", "2026/2027",
            courses, 0m, 0m, AcademicStandingStatus.GoodStanding));
    }
}
