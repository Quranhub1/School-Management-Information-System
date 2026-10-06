using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Inventory;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/stock-transactions")]
[Authorize(Policy = AuthorizationPolicies.InventoryManagement)]
public sealed class StockTransactionController(
    StockTransactionService stockTransactionService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStockTransactions(
        [FromQuery] Guid? stockItemId = null,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] string? transactionType = null,
        CancellationToken cancellationToken = default) =>
        Ok(await stockTransactionService.GetStockTransactionsAsync(
            stockItemId, fromDate, toDate, transactionType, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStockTransaction(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var transaction = await stockTransactionService.GetStockTransactionAsync(id, cancellationToken);
        return transaction is not null ? Ok(transaction) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> RecordStockTransaction(
        RecordStockTransactionRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var transaction = await stockTransactionService.RecordStockTransactionAsync(
                request.StockItemId,
                request.TransactionDate,
                request.TransactionType,
                request.Quantity,
                request.IssuedTo,
                request.IssuedBy,
                request.ReceivedFrom,
                request.ReferenceNumber,
                request.BatchNumber,
                request.ExpiryDate,
                request.Notes,
                request.RecordedBy,
                cancellationToken);
            return Created($"/api/inventory/stock-transactions/{transaction.Id}", transaction);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public sealed record RecordStockTransactionRequest(
    Guid StockItemId,
    DateOnly TransactionDate,
    string TransactionType,
    decimal Quantity,
    string? IssuedTo = null,
    string? IssuedBy = null,
    string? ReceivedFrom = null,
    string? ReferenceNumber = null,
    string? BatchNumber = null,
    DateOnly? ExpiryDate = null,
    string? Notes = null,
    string RecordedBy);