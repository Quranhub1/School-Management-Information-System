using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/bank-reconciliations")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class BankReconciliationController(BankReconciliationService service, BankReconciliationImportService importer) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? bankAccountId, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
        => Ok(await service.GetAsync(bankAccountId, from, to, cancellationToken));

    [HttpGet("{reconciliationId:guid}/lines")]
    public async Task<IActionResult> GetLines(Guid reconciliationId, CancellationToken cancellationToken)
        => Ok(await service.GetLinesAsync(reconciliationId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateBankReconciliationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.CreateAsync(request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{reconciliationId:guid}/lines")]
    public async Task<IActionResult> AddLine(Guid reconciliationId, AddBankStatementLineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.AddLineAsync(reconciliationId, request, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("lines/{lineId:guid}/match")]
    public async Task<IActionResult> MatchLine(Guid lineId, MatchBankStatementLineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.MatchLineAsync(lineId, request.JournalEntryId, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{reconciliationId:guid}/reconcile")]
    public async Task<IActionResult> Reconcile(Guid reconciliationId, CancellationToken cancellationToken)
    {
        try
        {
            var performedBy = User?.Identity?.Name;
            if (string.IsNullOrWhiteSpace(performedBy))
                return Unauthorized();

            return Ok(await service.ReconcileAsync(reconciliationId, performedBy, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{reconciliationId:guid}/import")]
    public async Task<IActionResult> Import(Guid reconciliationId, ImportBankStatementRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var rows = request.Lines?.Select(x => new ImportBankStatementLine(
                x.TransactionDate,
                x.Amount,
                x.TransactionType,
                x.Description,
                x.Reference)).ToList();

            return Ok(await importer.ImportAsync(reconciliationId, rows ?? [], cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    public sealed record MatchBankStatementLineRequest(Guid JournalEntryId);
    public sealed record ImportBankStatementRequest(IReadOnlyCollection<ImportBankStatementLineRequest>? Lines);
    public sealed record ImportBankStatementLineRequest(DateTimeOffset TransactionDate, decimal Amount, string TransactionType, string? Description = null, string? Reference = null);
}
