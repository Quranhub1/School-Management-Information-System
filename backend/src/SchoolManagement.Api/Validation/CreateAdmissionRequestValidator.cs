using FluentValidation;
using SchoolManagement.Application.Admissions;

namespace SchoolManagement.Api.Validation;

public sealed class CreateAdmissionRequestValidator : AbstractValidator<CreateAdmissionRequest>
{
    public CreateAdmissionRequestValidator()
    {
        RuleFor(x => x.ApplicantId).NotEmpty();
        RuleFor(x => x.ProgrammeId).NotEmpty();
        RuleFor(x => x.AcademicYearId).NotEmpty();
        RuleFor(x => x.IntakeId).NotEmpty();
    }
}
