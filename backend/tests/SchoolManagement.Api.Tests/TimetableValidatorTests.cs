using Xunit;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Api.Validation;
using SchoolManagement.Application.Timetable;

namespace SchoolManagement.Api.Tests;

public sealed class TimetableValidatorTests
{
    [Fact]
    public void CreateTimetableEntry_rejects_missing_relationships_and_invalid_time_range()
    {
        var request = new CreateTimetableEntryRequest(
            Guid.Empty, Guid.Empty, Guid.Empty, (DayOfWeek)99,
            new TimeOnly(10, 0), new TimeOnly(9, 0), null, null,
            Guid.Empty, 0, 0);

        var result = new CreateTimetableEntryRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateTimetableEntryRequest.TeachingGroupId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateTimetableEntryRequest.EndTime));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateTimetableEntryRequest.DayOfWeek));
    }

    [Fact]
    public void SaveTimetableTemplate_rejects_sessions_assigned_to_another_group()
    {
        var request = new SaveTimetableTemplateRequest(
            Guid.NewGuid(),
            [new CreateTimetableEntryRequest(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DayOfWeek.Monday,
                new TimeOnly(9, 0), new TimeOnly(10, 0), "Room 1", "Lecture", Guid.NewGuid(), 1, 1)],
            "{\"layout\":true}");

        var result = new SaveTimetableTemplateRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage.Contains("selected class", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void SaveTimetableTemplate_rejects_invalid_layout_json()
    {
        var request = new SaveTimetableTemplateRequest(Guid.NewGuid(), [], "{invalid");

        var result = new SaveTimetableTemplateRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(SaveTimetableTemplateRequest.LayoutJson));
    }

    [Fact]
    public void GenerateTimetable_requires_academic_scope()
    {
        var request = new GenerateTimetableRequest(Guid.Empty, null, 30, null);

        var result = new GenerateTimetableRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GenerateTimetableRequest.SemesterId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GenerateTimetableRequest.ProgrammeId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(GenerateTimetableRequest.CurriculumId));
    }
}
