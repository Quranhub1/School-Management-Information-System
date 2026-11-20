using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class CreateFiscalPeriodRequestValidator : AbstractValidator<FiscalPeriodsController.CreateFiscalPeriodRequest>
{
    public CreateFiscalPeriodRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate);
    }
}
