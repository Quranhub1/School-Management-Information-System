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

    public sealed record ImportBankStatementRequest(IReadOnlyCollection<ImportBankStatementLineRequest>? Lines);
    public sealed record ImportBankStatementLineRequest(DateTimeOffset TransactionDate, decimal Amount, string TransactionType, string? Description = null, string? Reference = null);
}
