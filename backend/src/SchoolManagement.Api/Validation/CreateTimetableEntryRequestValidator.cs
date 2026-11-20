using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class CreateTimetableEntryRequestValidator : AbstractValidator<CreateTimetableEntryRequest>
{
    public CreateTimetableEntryRequestValidator()
    {
        RuleFor(x => x.TeachingGroupId).NotEmpty();
        RuleFor(x => x.CourseId).NotEmpty();
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.CurriculumId).NotEmpty();
        RuleFor(x => x.DayOfWeek).IsInEnum();
        RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time.");
        RuleFor(x => x.Room).MaximumLength(100);
        RuleFor(x => x.SessionType).MaximumLength(50);
        RuleFor(x => x.YearOfStudy).GreaterThan(0);
        RuleFor(x => x.CurriculumSemesterNumber).GreaterThan(0);
    }
}
