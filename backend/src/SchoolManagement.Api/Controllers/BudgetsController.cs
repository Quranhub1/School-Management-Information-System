using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/budgets")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class BudgetsController(BudgetService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Budget>>> Get([FromQuery] Guid? academicYearId, [FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
        => Ok(await service.GetAsync(academicYearId, activeOnly, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<Budget>> Create([FromBody] CreateBudgetRequest request, CancellationToken cancellationToken)
        => Ok(await service.CreateAsync(request, cancellationToken));

    [HttpGet("{id:guid}/vs-actual")]
    public async Task<ActionResult<IReadOnlyList<BudgetVsActualRow>>> VsActual(Guid id, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken cancellationToken)
        => Ok(await service.GetVsActualAsync(id, from, to, cancellationToken));
}
