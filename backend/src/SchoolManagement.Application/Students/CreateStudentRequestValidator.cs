using FluentValidation;

namespace SchoolManagement.Application.Students;

public sealed class CreateStudentRequestValidator : AbstractValidator<CreateStudentRequest>
{
    public CreateStudentRequestValidator()
    {
        RuleFor(x => x.StudentNumber)
            .NotEmpty().WithMessage("Student number is required.")
            .MaximumLength(50).WithMessage("Student number must not exceed 50 characters.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.OtherNames)
            .MaximumLength(100).WithMessage("Other names must not exceed 100 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.OtherNames));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email must be a valid email address.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Phone number must not exceed 20 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.NationalId)
            .MaximumLength(50).WithMessage("National ID must not exceed 50 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.NationalId));
    }
}
