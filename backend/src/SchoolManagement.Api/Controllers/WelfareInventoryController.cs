using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Inventory;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/welfare")]
[Authorize(Policy = AuthorizationPolicies.InventoryManagement)]
public sealed class WelfareInventoryController(WelfareInventoryService service) : ControllerBase
{
    [HttpGet("commodities")]
    public async Task<IActionResult> Commodities(CancellationToken ct) => Ok(await service.GetCommoditiesAsync(ct));

    [HttpGet("daily")]
    public async Task<IActionResult> Daily([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? commodityId, CancellationToken ct)
        => Ok(await service.GetDailySheetAsync(from, to, commodityId, ct));

    [HttpGet("commodities/{commodityId:guid}/balance")]
    public async Task<IActionResult> Balance(Guid commodityId, CancellationToken ct)
    {
        try { return Ok(await service.GetBalanceAsync(commodityId, ct)); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("commodities")]
    public async Task<IActionResult> CreateCommodity(CreateCommodityRequest request, CancellationToken ct)
    {
        try { return Created("", await service.CreateCommodityAsync(request.Name, request.Category, request.Unit, request.ReorderLevel, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("transactions")]
    public async Task<IActionResult> Record(RecordTransactionRequest request, CancellationToken ct)
    {
        try
        {
            var user = User.Identity?.Name ?? "system";
            return Created("", await service.RecordAsync(request.CommodityId, request.Date, request.Type, request.Quantity, request.Supplier, request.Reference, request.BatchNumber, request.ExpiryDate, request.Notes, user, ct));
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}

public sealed record CreateCommodityRequest(string Name, string Category, string Unit, decimal ReorderLevel = 0);
public sealed record RecordTransactionRequest(Guid CommodityId, DateOnly Date, string Type, decimal Quantity, string? Supplier = null, string? Reference = null, string? BatchNumber = null, DateOnly? ExpiryDate = null, string? Notes = null);