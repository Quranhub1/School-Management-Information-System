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
        try
        {
            return Ok(await service.CloseAsync(request, user, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}
