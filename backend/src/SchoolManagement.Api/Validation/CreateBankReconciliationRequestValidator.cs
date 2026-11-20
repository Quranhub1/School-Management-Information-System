using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class CreateBankReconciliationRequestValidator : AbstractValidator<FinanceAdministrationController.CreateBankReconciliationRequest>
{
    public CreateBankReconciliationRequestValidator()
    {
        RuleFor(x => x.BankAccountId).NotEmpty();
        RuleFor(x => x.StatementDate).NotEqual(default(DateTimeOffset));
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}

public sealed class AddStatementLineRequestValidator : AbstractValidator<FinanceAdministrationController.AddStatementLineRequest>
{
    public AddStatementLineRequestValidator()
    {
        RuleFor(x => x.TransactionDate).NotEqual(default(DateTimeOffset));
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.TransactionType).Cascade(CascadeMode.Stop).NotEmpty().Must(value =>
            value.Equals("Credit", StringComparison.OrdinalIgnoreCase) ||
            value.Equals("Debit", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Transaction type must be Credit or Debit.");
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Reference).MaximumLength(100);
    }
}

public sealed class MatchStatementLineRequestValidator : AbstractValidator<FinanceAdministrationController.MatchStatementLineRequest>
{
    public MatchStatementLineRequestValidator()
    {
        RuleFor(x => x.JournalEntryId).NotEmpty();
    }
}
