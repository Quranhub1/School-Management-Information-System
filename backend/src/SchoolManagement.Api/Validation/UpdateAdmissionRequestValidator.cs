using FluentValidation;
using SchoolManagement.Application.Admissions;

namespace SchoolManagement.Api.Validation;

public sealed class UpdateAdmissionRequestValidator : AbstractValidator<UpdateAdmissionRequest>
{
    public UpdateAdmissionRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Status).MaximumLength(40);
    }
}
