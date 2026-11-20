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
}
