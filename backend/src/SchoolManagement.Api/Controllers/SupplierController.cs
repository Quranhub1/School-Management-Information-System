using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Inventory;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/suppliers")]
[Authorize(Policy = AuthorizationPolicies.InventoryManagement)]
public sealed class SupplierController(
    SupplierService supplierService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSuppliers(CancellationToken cancellationToken) =>
        Ok(await supplierService.GetSuppliersAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplier(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var supplier = await supplierService.GetSupplierAsync(id, cancellationToken);
        return supplier is not null ? Ok(supplier) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> CreateSupplier(
        CreateSupplierRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var supplier = await supplierService.CreateSupplierAsync(
                request.Name,
                request.ContactPerson,
                request.Phone,
                request.Email,
                request.Address,
                request.Category,
                request.IsActive,
                cancellationToken);
            return Created($"/api/inventory/suppliers/{supplier.Id}", supplier);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSupplier(
        Guid id,
        UpdateSupplierRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var supplier = await supplierService.UpdateSupplierAsync(
                id,
                request.Name,
                request.ContactPerson,
                request.Phone,
                request.Email,
                request.Address,
                request.Category,
                request.IsActive,
                cancellationToken);
            return Ok(supplier);
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
    public async Task<IActionResult> DeleteSupplier(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await supplierService.DeleteSupplierAsync(id, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

public sealed record CreateSupplierRequest(
    string Name,
    string? ContactPerson = null,
    string? Phone = null,
    string? Email = null,
    string? Address = null,
    string Category,
    bool IsActive = true);

public sealed record UpdateSupplierRequest(
    string Name,
    string? ContactPerson = null,
    string? Phone = null,
    string? Email = null,
    string? Address = null,
    string Category,
    bool IsActive);