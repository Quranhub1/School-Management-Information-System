using FluentValidation;
using SchoolManagement.Application.Timetable;

namespace SchoolManagement.Api.Validation;

public sealed class GenerateTimetableRequestValidator : AbstractValidator<GenerateTimetableRequest>
{
    public GenerateTimetableRequestValidator()
    {
        RuleFor(x => x.TeachingGroupIds)
            .Must(ids => ids is null || (ids.Count is > 0 and <= 200 && ids.All(id => id != Guid.Empty)))
            .WithMessage("Select between 1 and 200 valid teaching groups when supplying a group list.");
        RuleFor(x => x.SemesterId).NotEmpty();
        RuleFor(x => x.ProgrammeId).NotEmpty();
        RuleFor(x => x.CurriculumId).NotEmpty();
        RuleFor(x => x.YearOfStudy).NotNull().GreaterThan(0);
        RuleFor(x => x.CurriculumSemesterNumber).NotNull().GreaterThan(0);
        RuleFor(x => x.RotationIntervalMinutes).GreaterThan(0).LessThanOrEqualTo(240);
        RuleFor(x => x.GenerationSource).MaximumLength(100);
    }
}
