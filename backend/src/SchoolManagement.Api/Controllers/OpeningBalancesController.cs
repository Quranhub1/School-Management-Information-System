using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Application.Administration;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/opening-balances")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class OpeningBalancesController(OpeningBalanceService openingBalances, InstitutionSettingsService institutionSettings) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateOpeningBalanceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var user = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required." });
            var currency = string.IsNullOrWhiteSpace(request.Currency) ? (await institutionSettings.GetSystemCurrencyAsync(cancellationToken)).Code : request.Currency;
            var result = await openingBalances.CreateAsync(request.FiscalPeriodId, request.Lines, user, cancellationToken, currency);
            return Created($"/api/finance/journal-entries/{result.Id}", result);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    public sealed record CreateOpeningBalanceRequest(Guid FiscalPeriodId, IReadOnlyCollection<OpeningBalanceLineRequest> Lines, string? Currency = null);
}
