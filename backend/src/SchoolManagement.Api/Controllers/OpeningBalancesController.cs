using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/opening-balances")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class OpeningBalancesController(OpeningBalanceService openingBalances) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateOpeningBalanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var user = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required." });
            var result = await openingBalances.CreateAsync(request.FiscalPeriodId, request.Lines, user, cancellationToken);
            return Created($"/api/finance/journal-entries/{result.Id}", result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    public sealed record CreateOpeningBalanceRequest(Guid FiscalPeriodId, IReadOnlyCollection<OpeningBalanceLineRequest> Lines);
}
