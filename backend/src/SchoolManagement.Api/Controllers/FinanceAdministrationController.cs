using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/administration")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceAdministrationController(FinanceAdministrationService finance) : ControllerBase
{
    [HttpGet("budgets")]
    public async Task<IActionResult> GetBudgets([FromQuery] Guid? departmentId, [FromQuery] Guid? academicYearId, [FromQuery] bool activeOnly = false, CancellationToken cancellationToken = default) =>
        Ok(await finance.GetBudgetsAsync(departmentId, academicYearId, activeOnly, cancellationToken));

    [HttpPost("budgets")]
    public async Task<IActionResult> CreateBudget(CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var budget = await finance.CreateBudgetAsync(request.DepartmentId, request.AcademicYearId, request.Name, request.TotalAmount, request.Currency, request.StartDate, request.EndDate, cancellationToken);
            return Created($"/api/finance/administration/budgets/{budget.Id}", budget);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("budgets/{budgetId:guid}/lines")]
    public async Task<IActionResult> AddBudgetLine(Guid budgetId, AddBudgetLineRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.AddBudgetLineAsync(budgetId, request.AccountId, request.Category, request.AllocatedAmount, request.Notes, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("bank-reconciliations")]
    public async Task<IActionResult> GetBankReconciliations([FromQuery] Guid? bankAccountId, CancellationToken cancellationToken) =>
        Ok(await finance.GetBankReconciliationsAsync(bankAccountId, cancellationToken));

    [HttpPost("bank-reconciliations")]
    public async Task<IActionResult> CreateBankReconciliation(CreateBankReconciliationRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.CreateBankReconciliationAsync(request.BankAccountId, request.StatementDate, request.StatementBalance, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("bank-reconciliations/{reconciliationId:guid}/lines")]
    public async Task<IActionResult> GetStatementLines(Guid reconciliationId, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.GetBankStatementLinesAsync(reconciliationId, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/lines")]
    public async Task<IActionResult> AddStatementLine(Guid reconciliationId, AddStatementLineRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.AddStatementLineAsync(reconciliationId, request.TransactionDate, request.Description, request.Amount, request.TransactionType, request.Reference, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/lines/{statementLineId:guid}/match")]
    public async Task<IActionResult> MatchStatementLine(Guid reconciliationId, Guid statementLineId, MatchStatementLineRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await finance.MatchStatementLineAsync(reconciliationId, statementLineId, request.JournalEntryId, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/close")]
    public async Task<IActionResult> CloseBankReconciliation(Guid reconciliationId, CancellationToken cancellationToken)
    {
        try
        {
            var closedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(closedBy)) return Unauthorized(new { message = "Authenticated user identity is required to close a reconciliation." });
            return Ok(await finance.CloseBankReconciliationAsync(reconciliationId, closedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    public sealed record CreateBudgetRequest(Guid DepartmentId, Guid AcademicYearId, string Name, decimal TotalAmount, string Currency, DateTimeOffset StartDate, DateTimeOffset EndDate);
    public sealed record AddBudgetLineRequest(Guid AccountId, string Category, decimal AllocatedAmount, string? Notes = null);
    public sealed record CreateBankReconciliationRequest(Guid BankAccountId, DateTimeOffset StatementDate, decimal StatementBalance);
    public sealed record AddStatementLineRequest(DateTimeOffset TransactionDate, string? Description, decimal Amount, string TransactionType, string? Reference = null);
    public sealed record MatchStatementLineRequest(Guid JournalEntryId);
}
