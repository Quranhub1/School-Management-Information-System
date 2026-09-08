using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/administration")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FinanceAdministrationController(BudgetService budgets, BankReconciliationService bankReconciliations) : ControllerBase
{
    [HttpGet("budgets")]
    public async Task<IActionResult> GetBudgets([FromQuery] Guid? academicYearId, [FromQuery] bool activeOnly = false, CancellationToken cancellationToken = default) =>
        Ok(await budgets.GetAsync(academicYearId, activeOnly, cancellationToken));

    [HttpPost("budgets")]
    public async Task<IActionResult> CreateBudget(CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var budget = await budgets.CreateAsync(new SchoolManagement.Application.Finance.CreateBudgetRequest(
                request.DepartmentId,
                request.AcademicYearId,
                request.Name,
                request.Currency,
                request.StartDate,
                request.EndDate,
                request.Lines.Select(x => new BudgetLineRequest(x.AccountId, x.Category, x.AllocatedAmount, x.Notes)).ToArray()), cancellationToken);
            return Created($"/api/finance/administration/budgets/{budget.Id}", budget);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("budgets/{budgetId:guid}/vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual(Guid budgetId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
    {
        try { return Ok(await budgets.GetVsActualAsync(budgetId, from, to, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("bank-reconciliations")]
    public async Task<IActionResult> GetBankReconciliations([FromQuery] Guid? bankAccountId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken) =>
        Ok(await bankReconciliations.GetAsync(bankAccountId, from, to, cancellationToken));

    [HttpPost("bank-reconciliations")]
    public async Task<IActionResult> CreateBankReconciliation(CreateBankReconciliationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await bankReconciliations.CreateAsync(new SchoolManagement.Application.Finance.CreateBankReconciliationRequest(
                request.BankAccountId,
                request.StatementDate,
                request.StatementBalance,
                request.BookBalance,
                request.ReconciledAmount,
                request.Notes), cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("bank-reconciliations/{reconciliationId:guid}/lines")]
    public async Task<IActionResult> GetStatementLines(Guid reconciliationId, CancellationToken cancellationToken)
    {
        try { return Ok(await bankReconciliations.GetLinesAsync(reconciliationId, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpGet("bank-reconciliations/{reconciliationId:guid}/outstanding")]
    public async Task<IActionResult> GetOutstanding(Guid reconciliationId, [FromQuery] DateTimeOffset? asOf, CancellationToken cancellationToken)
    {
        try { return Ok(await bankReconciliations.GetOutstandingReportAsync(reconciliationId, asOf, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/lines")]
    public async Task<IActionResult> AddStatementLine(Guid reconciliationId, AddStatementLineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bankReconciliations.AddLineAsync(reconciliationId, new AddBankStatementLineRequest(
                request.TransactionDate, request.Amount, request.TransactionType, request.Description, request.Reference), cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/lines/{statementLineId:guid}/match")]
    public async Task<IActionResult> MatchStatementLine(Guid reconciliationId, Guid statementLineId, MatchStatementLineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var line = await bankReconciliations.MatchLineAsync(statementLineId, request.JournalEntryId, cancellationToken);
            if (line.BankReconciliationId != reconciliationId) return BadRequest(new { message = "The statement line does not belong to the specified reconciliation." });
            return Ok(line);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("bank-reconciliations/{reconciliationId:guid}/close")]
    public async Task<IActionResult> CloseBankReconciliation(Guid reconciliationId, CancellationToken cancellationToken)
    {
        try
        {
            var closedBy = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(closedBy)) return Unauthorized(new { message = "Authenticated user identity is required to close a reconciliation." });
            return Ok(await bankReconciliations.ReconcileAsync(reconciliationId, closedBy, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    // API-layer request names are kept stable while application services own their domain contracts.
    public sealed record CreateBudgetRequest(Guid DepartmentId, Guid AcademicYearId, string Name, string Currency, DateTimeOffset StartDate, DateTimeOffset EndDate, IReadOnlyCollection<AddBudgetLineRequest> Lines);
    public sealed record AddBudgetLineRequest(Guid AccountId, string Category, decimal AllocatedAmount, string? Notes = null);
    public sealed record CreateBankReconciliationRequest(Guid BankAccountId, DateTimeOffset StatementDate, decimal StatementBalance, decimal BookBalance, decimal ReconciledAmount, string? Notes = null);
    public sealed record AddStatementLineRequest(DateTimeOffset TransactionDate, decimal Amount, string TransactionType, string? Description = null, string? Reference = null);
    public sealed record MatchStatementLineRequest(Guid JournalEntryId);
}
