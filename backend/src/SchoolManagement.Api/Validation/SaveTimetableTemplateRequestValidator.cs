using System.Text.Json;
using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class SaveTimetableTemplateRequestValidator : AbstractValidator<SaveTimetableTemplateRequest>
{
    public SaveTimetableTemplateRequestValidator()
    {
        RuleFor(x => x.TeachingGroupId).NotEmpty();
        RuleFor(x => x.Entries).NotNull().Must(entries => entries.Count <= 200)
            .WithMessage("A timetable template cannot contain more than 200 sessions.");
        RuleForEach(x => x.Entries).SetValidator(new CreateTimetableEntryRequestValidator());
        RuleForEach(x => x.Entries).Must((request, entry) => entry.TeachingGroupId == request.TeachingGroupId)
            .WithMessage("Every session must belong to the selected class.");
        RuleFor(x => x.LayoutJson).MaximumLength(100000);
        RuleFor(x => x.LayoutJson).Must(IsValidJson)
            .When(x => !string.IsNullOrWhiteSpace(x.LayoutJson))
            .WithMessage("The timetable layout is not valid JSON.");
    }

    private static bool IsValidJson(string? value)
    {
        try
        {
            using var document = JsonDocument.Parse(value!);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
