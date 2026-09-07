using SchoolManagement.Application.Timetable;
using Xunit;

namespace SchoolManagement.Application.Tests.Timetable;

public sealed class TimetableWorkflowServiceTests
{
    private readonly TimetableWorkflowService _service = new();

    [Fact]
    public void CreateEntry_CreatesNormalizedActiveEntry()
    {
        var teachingGroupId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var entry = _service.CreateEntry(
            teachingGroupId,
            courseId,
            teacherId,
            DayOfWeek.Monday,
            new TimeOnly(8, 0),
            new TimeOnly(10, 0),
            "  Lab 1  ",
            "  Lecture  ");

        Assert.NotEqual(Guid.Empty, entry.Id);
        Assert.Equal(teachingGroupId, entry.TeachingGroupId);
        Assert.Equal(courseId, entry.CourseId);
        Assert.Equal(teacherId, entry.TeacherId);
        Assert.Equal(DayOfWeek.Monday, entry.DayOfWeek);
        Assert.Equal(new TimeOnly(8, 0), entry.StartTime);
        Assert.Equal(new TimeOnly(10, 0), entry.EndTime);
        Assert.Equal("Lab 1", entry.Room);
        Assert.Equal("Lecture", entry.SessionType);
        Assert.True(entry.IsActive);
    }

    [Fact]
    public void CreateEntry_RejectsEmptyTeachingGroup()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            _service.CreateEntry(
                Guid.Empty,
                Guid.NewGuid(),
                Guid.NewGuid(),
                DayOfWeek.Monday,
                new TimeOnly(8, 0),
                new TimeOnly(10, 0)));

        Assert.Equal("teachingGroupId", exception.ParamName);
    }

    [Fact]
    public void CreateEntry_RejectsEmptyCourse()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            _service.CreateEntry(
                Guid.NewGuid(),
                Guid.Empty,
                Guid.NewGuid(),
                DayOfWeek.Monday,
                new TimeOnly(8, 0),
                new TimeOnly(10, 0)));

        Assert.Equal("courseId", exception.ParamName);
    }

    [Fact]
    public void CreateEntry_RejectsEmptyTeacher()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            _service.CreateEntry(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.Empty,
                DayOfWeek.Monday,
                new TimeOnly(8, 0),
                new TimeOnly(10, 0)));

        Assert.Equal("teacherId", exception.ParamName);
    }

    [Fact]
    public void CreateEntry_RejectsNonIncreasingTimeRange()
    {
        var exception = Assert.Throws<ArgumentException>(() =>
            _service.CreateEntry(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                DayOfWeek.Tuesday,
                new TimeOnly(10, 0),
                new TimeOnly(10, 0)));

        Assert.Equal("endTime", exception.ParamName);
    }

    [Fact]
    public void CreateEntry_ConvertsBlankOptionalValuesToNull()
    {
        var entry = _service.CreateEntry(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            DayOfWeek.Wednesday,
            new TimeOnly(9, 0),
            new TimeOnly(11, 0),
            "   ",
            "");

        Assert.Null(entry.Room);
        Assert.Null(entry.SessionType);
    }
}
