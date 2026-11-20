using FluentValidation;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Validation;

public sealed class CreateOpeningBalanceRequestValidator : AbstractValidator<OpeningBalancesController.CreateOpeningBalanceRequest>
{
    public CreateOpeningBalanceRequestValidator()
    {
        RuleFor(x => x.FiscalPeriodId).NotEmpty();
        RuleFor(x => x.Currency).MaximumLength(3);
        RuleFor(x => x.Lines).Cascade(CascadeMode.Stop).NotNull().Must(lines => lines.Count >= 2)
            .WithMessage("At least two opening-balance lines are required.");
        RuleForEach(x => x.Lines).SetValidator(new OpeningBalanceLineRequestValidator());
    }
}

public sealed class OpeningBalanceLineRequestValidator : AbstractValidator<OpeningBalanceLineRequest>
{
    public OpeningBalanceLineRequestValidator()
    {
        RuleFor(x => x.AccountId).NotEmpty();
        RuleFor(x => x.Debit).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Credit).GreaterThanOrEqualTo(0);
        RuleFor(x => x).Must(line => !(line.Debit > 0 && line.Credit > 0) && (line.Debit > 0 || line.Credit > 0))
            .WithMessage("Each opening-balance line must contain either a positive debit or a positive credit, but not both.");
        RuleFor(x => x.Description).MaximumLength(500);
    }
}
