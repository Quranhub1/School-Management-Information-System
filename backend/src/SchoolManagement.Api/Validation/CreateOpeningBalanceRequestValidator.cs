using FluentValidation;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Validation;

public sealed class CreateOpeningBalanceRequestValidator : AbstractValidator<OpeningBalancesController.CreateOpeningBalanceRequest>
{
    public CreateOpeningBalanceRequestValidator()
    {
        RuleFor(x => x.FiscalPeriodId).NotEmpty();
        RuleFor(x => x.Currency).Must(value => string.IsNullOrWhiteSpace(value) || (value.Trim().Length == 3 && value.Trim().All(char.IsLetter)))
            .WithMessage("Currency must be a three-letter ISO code.");
        RuleFor(x => x.Lines).Cascade(CascadeMode.Stop).NotNull().Must(lines => lines.Count >= 2)
            .WithMessage("At least two opening-balance lines are required.");
        RuleForEach(x => x.Lines).SetValidator(new OpeningBalanceLineRequestValidator());
        RuleFor(x => x).Must(request => request.Lines is null ||
            request.Lines.Sum(line => line.Debit) == request.Lines.Sum(line => line.Credit))
            .WithMessage("Opening balances must balance: total debits must equal total credits.");
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
