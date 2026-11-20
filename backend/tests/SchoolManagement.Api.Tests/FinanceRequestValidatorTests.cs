using SchoolManagement.Api.Controllers;
using SchoolManagement.Api.Validation;

namespace SchoolManagement.Api.Tests;

public sealed class FinanceRequestValidatorTests
{
    [Fact]
    public void CreateBudget_requires_department_year_and_at_least_one_line()
    {
        var request = new FinanceAdministrationController.CreateBudgetRequest(
            Guid.Empty, Guid.Empty, "", "UGX",
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 12, 31, 0, 0, 0, TimeSpan.Zero),
            Array.Empty<FinanceAdministrationController.AddBudgetLineRequest>());

        var result = new CreateBudgetRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.CreateBudgetRequest.DepartmentId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.CreateBudgetRequest.AcademicYearId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.CreateBudgetRequest.Lines));
    }

    [Fact]
    public void CreateBudget_rejects_negative_budget_line_amount()
    {
        var request = new FinanceAdministrationController.CreateBudgetRequest(
            Guid.NewGuid(), Guid.NewGuid(), "ICT Budget", "UGX",
            new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 12, 31, 0, 0, 0, TimeSpan.Zero),
            [new FinanceAdministrationController.AddBudgetLineRequest(Guid.NewGuid(), "Equipment", -1m)]);

        var result = new CreateBudgetRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName.EndsWith("AllocatedAmount", StringComparison.Ordinal));
    }

    [Fact]
    public void CreateBankReconciliation_requires_bank_account()
    {
        var request = new FinanceAdministrationController.CreateBankReconciliationRequest(
            Guid.Empty, DateTimeOffset.UtcNow, 100m, 100m, 100m);

        var result = new CreateBankReconciliationRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.CreateBankReconciliationRequest.BankAccountId));
    }

    [Fact]
    public void AddStatementLine_requires_positive_amount_and_supported_type()
    {
        var request = new FinanceAdministrationController.AddStatementLineRequest(
            DateTimeOffset.UtcNow, -50m, "Unknown");

        var result = new AddStatementLineRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.AddStatementLineRequest.Amount));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.AddStatementLineRequest.TransactionType));
    }

    [Fact]
    public void MatchStatementLine_requires_journal_entry()
    {
        var result = new MatchStatementLineRequestValidator()
            .Validate(new FinanceAdministrationController.MatchStatementLineRequest(Guid.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FinanceAdministrationController.MatchStatementLineRequest.JournalEntryId));
    }
    [Fact]
    public void OpeningBalances_require_balanced_debit_and_credit_totals()
    {
        var request = new OpeningBalancesController.CreateOpeningBalanceRequest(
            Guid.NewGuid(),
            [
                new SchoolManagement.Application.Finance.OpeningBalanceLineRequest(Guid.NewGuid(), 100m, 0m),
                new SchoolManagement.Application.Finance.OpeningBalanceLineRequest(Guid.NewGuid(), 0m, 50m),
            ],
            "UGX");

        var result = new CreateOpeningBalanceRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.ErrorMessage.Contains("must balance", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void FiscalPeriod_requires_valid_date_range()
    {
        var request = new FiscalPeriodsController.CreateFiscalPeriodRequest(
            "FY2026", new DateOnly(2026, 12, 31), new DateOnly(2026, 1, 1));

        var result = new CreateFiscalPeriodRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(FiscalPeriodsController.CreateFiscalPeriodRequest.EndDate));
    }

    [Fact]
    public void FiscalPeriodClosing_requires_period_and_retained_earnings_account()
    {
        var result = new CloseFiscalPeriodRequestValidator().Validate(
            new SchoolManagement.Application.Finance.CloseFiscalPeriodRequest(Guid.Empty, Guid.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(SchoolManagement.Application.Finance.CloseFiscalPeriodRequest.FiscalPeriodId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(SchoolManagement.Application.Finance.CloseFiscalPeriodRequest.RetainedEarningsAccountId));
    }

}
