using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class AdmitApplicantRequestValidator : AbstractValidator<AdmitApplicantRequest>
{
    public AdmitApplicantRequestValidator()
    {
        RuleFor(x => x.ProgrammeId).NotEmpty();
        RuleFor(x => x.IntakeId).NotEmpty();
        RuleFor(x => x.AcademicYearId).NotEmpty();
        RuleFor(x => x.StudentNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AdmissionNumber).MaximumLength(50);
        RuleFor(x => x.AdmissionType).MaximumLength(50);
        RuleFor(x => x.DecisionReference).MaximumLength(100);
    }
}
