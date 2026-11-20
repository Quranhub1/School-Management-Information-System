using FluentValidation;
using SchoolManagement.Application.Admissions;

namespace SchoolManagement.Api.Validation;

public sealed class DecideAdmissionRequestValidator : AbstractValidator<DecideAdmissionRequest>
{
    public DecideAdmissionRequestValidator()
    {
        RuleFor(x => x.Decision).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Reason).MaximumLength(2000);
        RuleFor(x => x.DecidedBy).MaximumLength(120);
    }
}
