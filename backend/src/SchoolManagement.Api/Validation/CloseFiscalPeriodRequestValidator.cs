using FluentValidation;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Validation;

public sealed class CloseFiscalPeriodRequestValidator : AbstractValidator<CloseFiscalPeriodRequest>
{
    public CloseFiscalPeriodRequestValidator()
    {
        RuleFor(x => x.FiscalPeriodId).NotEmpty();
        RuleFor(x => x.RetainedEarningsAccountId).NotEmpty();
    }
}
