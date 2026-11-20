using FluentValidation.Results;
using SchoolManagement.Application.Timetable;
using Xunit;

namespace SchoolManagement.Application.Tests.Timetable;

public sealed class TimetableValidatorTests
{
    [Fact]
    public void CreateTimetableEntry_ValidRequest_Passes()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), "Room 101", "Lecture",
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void CreateTimetableEntry_EmptyTeachingGroupId_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), null, null,
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.TeachingGroupId));
    }

    [Fact]
    public void CreateTimetableEntry_EmptyCourseId_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.Empty, Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), null, null,
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.CourseId));
    }

    [Fact]
    public void CreateTimetableEntry_EmptyTeacherId_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.Empty, DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), null, null,
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.TeacherId));
    }

    [Fact]
    public void CreateTimetableEntry_EndTimeBeforeStartTime_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(9, 0), new TimeOnly(8, 0), null, null,
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.EndTime));
    }

    [Fact]
    public void CreateTimetableEntry_YearOfStudyZero_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), null, null,
            Guid.NewGuid(), 0, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.YearOfStudy));
    }

    [Fact]
    public void CreateTimetableEntry_CurriculumSemesterZero_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), null, null,
            Guid.NewGuid(), 1, 0);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.CurriculumSemesterNumber));
    }

    [Fact]
    public void CreateTimetableEntry_RoomTooLong_Fails()
    {
        var validator = new CreateTimetableEntryValidator();
        var request = new CreateTimetableEntryDto(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
            new TimeOnly(8, 0), new TimeOnly(9, 0), new string('A', 101), "Lecture",
            Guid.NewGuid(), 1, 1);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateTimetableEntryDto.Room));
    }

    [Fact]
    public void SaveTimetableTemplate_ValidRequest_Passes()
    {
        var validator = new SaveTimetableTemplateValidator();
        var request = new SaveTimetableTemplateDto(
            Guid.NewGuid(),
            new List<CreateTimetableEntryDto>
            {
                new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
                    new TimeOnly(8, 0), new TimeOnly(9, 0), "Room 101", "Lecture",
                    Guid.NewGuid(), 1, 1)
            },
            "{\"slots\":[]}");

        ValidationResult result = validator.Validate(request);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void SaveTimetableTemplate_EmptyTeachingGroupId_Fails()
    {
        var validator = new SaveTimetableTemplateValidator();
        var request = new SaveTimetableTemplateDto(
            Guid.Empty,
            new List<CreateTimetableEntryDto>(),
            null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SaveTimetableTemplateDto.TeachingGroupId));
    }

    [Fact]
    public void SaveTimetableTemplate_InvalidEntry_Fails()
    {
        var validator = new SaveTimetableTemplateValidator();
        var request = new SaveTimetableTemplateDto(
            Guid.NewGuid(),
            new List<CreateTimetableEntryDto>
            {
                new(Guid.NewGuid(), Guid.Empty, Guid.NewGuid(), DayOfWeek.Monday,
                    new TimeOnly(9, 0), new TimeOnly(8, 0), null, null,
                    Guid.NewGuid(), 1, 1)
            },
            null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void SaveTimetableTemplate_LayoutJsonTooLong_Fails()
    {
        var validator = new SaveTimetableTemplateValidator();
        var request = new SaveTimetableTemplateDto(
            Guid.NewGuid(),
            new List<CreateTimetableEntryDto>(),
            new string('x', 100_001));

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(SaveTimetableTemplateDto.LayoutJson));
    }
}
