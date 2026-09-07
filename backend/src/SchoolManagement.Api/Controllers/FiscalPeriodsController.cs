using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance/fiscal-periods")]
[Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
public sealed class FiscalPeriodsController(FiscalPeriodService periods) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => Ok(await periods.GetAsync(cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateFiscalPeriodRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var period = await periods.CreateAsync(request.Name, request.StartDate, request.EndDate, cancellationToken);
            return Created($"/api/finance/fiscal-periods/{period.Id}", period);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var user = User.Identity?.Name;
            if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required to close a fiscal period." });
            return Ok(await periods.CloseAsync(id, user, cancellationToken));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    public sealed record CreateFiscalPeriodRequest(string Name, DateOnly StartDate, DateOnly EndDate);
}
