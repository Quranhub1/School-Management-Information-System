using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/budgets")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class BudgetsController(BudgetService service, InstitutionSettingsService institutionSettings) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Budget>>> Get([FromQuery] Guid? academicYearId, [FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
        => Ok(await service.GetAsync(academicYearId, activeOnly, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<Budget>> Create([FromBody] CreateBudgetRequest request, CancellationToken cancellationToken)
    {
        var currency = string.IsNullOrWhiteSpace(request.Currency)
            ? (await institutionSettings.GetSystemCurrencyAsync(cancellationToken)).Code
            : request.Currency.Trim().ToUpperInvariant();
        return Ok(await service.CreateAsync(request with { Currency = currency }, cancellationToken));
    }

    [HttpGet("{id:guid}/vs-actual")]
    public async Task<ActionResult<IReadOnlyList<BudgetVsActualRow>>> VsActual(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
        => Ok(await service.GetVsActualAsync(id, from, to, cancellationToken));
}
