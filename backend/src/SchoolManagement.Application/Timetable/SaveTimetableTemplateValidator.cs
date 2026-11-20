using FluentValidation;

namespace SchoolManagement.Application.Timetable;

public sealed class SaveTimetableTemplateValidator : AbstractValidator<SaveTimetableTemplateDto>
{
    public SaveTimetableTemplateValidator()
    {
        RuleFor(x => x.TeachingGroupId)
            .NotEmpty().WithMessage("A teaching group is required.");

        RuleForEach(x => x.Entries)
            .SetValidator(new CreateTimetableEntryValidator());

        RuleFor(x => x.LayoutJson)
            .MaximumLength(100_000).WithMessage("The timetable layout is too large to save.")
            .When(x => !string.IsNullOrWhiteSpace(x.LayoutJson));
    }
}
