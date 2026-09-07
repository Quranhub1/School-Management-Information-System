using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/fiscal-period-closing")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FiscalPeriodClosingController(FiscalPeriodClosingService service) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<FiscalPeriod>> Close([FromBody] CloseFiscalPeriodRequest request, CancellationToken cancellationToken)
    {
        var user = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(user)) return Unauthorized();
        return Ok(await service.CloseAsync(request, user, cancellationToken));
    }
}
