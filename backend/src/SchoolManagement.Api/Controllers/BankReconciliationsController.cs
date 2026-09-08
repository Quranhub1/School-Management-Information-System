using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/bank-reconciliations")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class BankReconciliationsController(
    BankReconciliationService service,
    BankReconciliationImportService imports) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<BankReconciliation>> Get(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken) => service.GetAsync(bankAccountId, from, to, cancellationToken);

    [HttpPost]
    public async Task<ActionResult<BankReconciliation>> Create([FromBody] CreateBankReconciliationRequest request, CancellationToken cancellationToken) => Ok(await service.CreateAsync(request, cancellationToken));

    [HttpGet("{id:guid}/lines")]
    public async Task<ActionResult<IReadOnlyList<BankStatementLine>>> GetLines(Guid id, CancellationToken cancellationToken) => Ok(await service.GetLinesAsync(id, cancellationToken));

    [HttpPost("{id:guid}/lines")]
    public async Task<ActionResult<BankStatementLine>> AddLine(Guid id, [FromBody] AddBankStatementLineRequest request, CancellationToken cancellationToken) => Ok(await service.AddLineAsync(id, request, cancellationToken));

    [HttpPost("{id:guid}/import")]
    public async Task<ActionResult<IReadOnlyList<BankStatementLine>>> Import(Guid id, [FromBody] IReadOnlyCollection<ImportBankStatementLine> rows, CancellationToken cancellationToken) => Ok(await imports.ImportAsync(id, rows, cancellationToken));

    [HttpGet("{id:guid}/outstanding")]
    public async Task<ActionResult<BankReconciliationOutstandingReport>> Outstanding(Guid id, DateTimeOffset? asOf, CancellationToken cancellationToken) => Ok(await service.GetOutstandingReportAsync(id, asOf, cancellationToken));

    [HttpPost("lines/{lineId:guid}/match/{journalEntryId:guid}")]
    public async Task<ActionResult<BankStatementLine>> MatchLine(Guid lineId, Guid journalEntryId, CancellationToken cancellationToken) => Ok(await service.MatchLineAsync(lineId, journalEntryId, cancellationToken));

    [HttpPost("{id:guid}/reconcile")]
    public async Task<ActionResult<BankReconciliation>> Reconcile(Guid id, CancellationToken cancellationToken)
    {
        var user = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(user)) return Unauthorized();
        return Ok(await service.ReconcileAsync(id, user, cancellationToken));
    }
}