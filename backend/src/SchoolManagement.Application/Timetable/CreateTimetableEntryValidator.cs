using FluentValidation;

namespace SchoolManagement.Application.Timetable;

public sealed class CreateTimetableEntryValidator : AbstractValidator<CreateTimetableEntryDto>
{
    public CreateTimetableEntryValidator()
    {
        RuleFor(x => x.TeachingGroupId)
            .NotEmpty().WithMessage("A teaching group is required.");

        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("A course unit is required.");

        RuleFor(x => x.TeacherId)
            .NotEmpty().WithMessage("A teacher is required.");

        RuleFor(x => x.CurriculumId)
            .NotEmpty().WithMessage("A curriculum is required.");

        RuleFor(x => x.YearOfStudy)
            .GreaterThanOrEqualTo(1).WithMessage("Year of study must be at least 1.");

        RuleFor(x => x.CurriculumSemesterNumber)
            .GreaterThanOrEqualTo(1).WithMessage("Curriculum semester must be at least 1.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime)
            .WithMessage("End time must be after start time.");

        RuleFor(x => x.Room)
            .MaximumLength(100).WithMessage("Room must not exceed 100 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Room));

        RuleFor(x => x.SessionType)
            .MaximumLength(60).WithMessage("Session type must not exceed 60 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.SessionType));
    }
}
