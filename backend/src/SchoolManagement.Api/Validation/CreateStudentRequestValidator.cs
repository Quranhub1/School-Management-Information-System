using FluentValidation;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Api.Validation;

public sealed class CreateStudentRequestValidator : AbstractValidator<CreateStudentRequest>
{
    public CreateStudentRequestValidator()
    {
        RuleFor(x => x.StudentNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OtherNames).MaximumLength(150);
        RuleFor(x => x.Gender).MaximumLength(30);
        RuleFor(x => x.NationalId).MaximumLength(50);
        RuleFor(x => x.PhoneNumber).MaximumLength(32);
        RuleFor(x => x.Email).MaximumLength(254)
            .EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.DateOfBirth)
            .Must(date => date is null || date.Value <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date of birth cannot be in the future.");
    }
}
