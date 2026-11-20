using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class CreateBudgetRequestValidator : AbstractValidator<FinanceAdministrationController.CreateBudgetRequest>
{
    public CreateBudgetRequestValidator()
    {
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.AcademicYearId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Currency).Must(value => string.IsNullOrWhiteSpace(value) || (value.Trim().Length == 3 && value.Trim().All(char.IsLetter)))
            .WithMessage("Currency must be a three-letter ISO code.");
        RuleFor(x => x.StartDate).NotEqual(default(DateTimeOffset));
        RuleFor(x => x.EndDate).NotEqual(default(DateTimeOffset));
        RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.Lines).Cascade(CascadeMode.Stop).NotNull().NotEmpty()
            .Must(lines => lines.Count <= 200)
            .WithMessage("A budget cannot contain more than 200 lines.");
        RuleForEach(x => x.Lines).SetValidator(new AddBudgetLineRequestValidator());
    }
}

public sealed class AddBudgetLineRequestValidator : AbstractValidator<FinanceAdministrationController.AddBudgetLineRequest>
{
    public AddBudgetLineRequestValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AllocatedAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Notes).MaximumLength(500);
    }
}
