using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Inventory;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/stock")]
[Authorize(Policy = AuthorizationPolicies.InventoryManagement)]
public sealed class StockItemController(
    StockItemService stockItemService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStockItems(CancellationToken cancellationToken) =>
        Ok(await stockItemService.GetStockItemsAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStockItem(Guid id, CancellationToken cancellationToken)
    {
        var item = await stockItemService.GetStockItemAsync(id, cancellationToken);
        return item is not null ? Ok(item) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> CreateStockItem(
        CreateStockItemRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var item = await stockItemService.CreateStockItemAsync(
                request.Name,
                request.Category,
                request.Unit,
                request.Quantity,
                request.ReorderLevel,
                request.Location,
                request.SupplierId,
                request.ExpiryDate,
                request.Description,
                cancellationToken);
            return Created($"/api/inventory/stock/{item.Id}", item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStockItem(
        Guid id,
        UpdateStockItemRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var item = await stockItemService.UpdateStockItemAsync(
                id,
                request.Name,
                request.Category,
                request.Unit,
                request.Quantity,
                request.ReorderLevel,
                request.Location,
                request.SupplierId,
                request.ExpiryDate,
                request.Description,
                request.IsActive,
                cancellationToken);
            return Ok(item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteStockItem(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            await stockItemService.DeleteStockItemAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStockItems(CancellationToken cancellationToken) =>
        Ok(await stockItemService.GetLowStockItemsAsync(cancellationToken));
}

public sealed record CreateStockItemRequest(
    string Name,
    string Category,
    string Unit,
    decimal Quantity,
    decimal ReorderLevel,
    string? Location = null,
    Guid? SupplierId = null,
    DateOnly? ExpiryDate = null,
    string? Description = null);

public sealed record UpdateStockItemRequest(
    string Name,
    string Category,
    string Unit,
    decimal Quantity,
    decimal ReorderLevel,
    string? Location = null,
    Guid? SupplierId = null,
    DateOnly? ExpiryDate = null,
    string? Description = null,
    bool IsActive);