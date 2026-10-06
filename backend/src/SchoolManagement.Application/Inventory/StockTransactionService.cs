using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Application.Inventory;

public sealed class StockTransactionService(
    IStockTransactionRepository stockTransactionRepository,
    IStockItemRepository stockItemRepository)
{
    public Task<IReadOnlyList<StockTransaction>> GetStockTransactionsAsync(
        Guid? stockItemId = null,
        DateOnly? fromDate = null,
        DateOnly? toDate = null,
        string? transactionType = null,
        CancellationToken cancellationToken = default) =>
        stockTransactionRepository.GetStockTransactionsAsync(stockItemId, fromDate, toDate, transactionType, cancellationToken);

    public Task<StockTransaction?> GetStockTransactionAsync(Guid id, CancellationToken cancellationToken = default) =>
        stockTransactionRepository.GetStockTransactionAsync(id, cancellationToken);

    public async Task<StockTransaction> RecordStockTransactionAsync(
        Guid stockItemId,
        DateOnly transactionDate,
        string transactionType,
        decimal quantity,
        string? issuedTo,
        string? issuedBy,
        string? receivedFrom,
        string? referenceNumber,
        string? batchNumber,
        DateOnly? expiryDate,
        string? notes,
        string recordedBy,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(transactionType)) throw new ArgumentException("Transaction type is required.", nameof(transactionType));
        if (quantity == 0) throw new ArgumentException("Quantity must not be zero.", nameof(quantity));
        if (string.IsNullOrWhiteSpace(recordedBy)) throw new ArgumentException("Recorded by is required.", nameof(recordedBy));

        // Validate stock item exists
        var stockItem = await stockItemRepository.GetStockItemAsync(stockItemId, cancellationToken)
            ?? throw new KeyNotFoundException($"Stock item with ID {stockItemId} not found.");

        // Validate transaction type
        var validTypes = new[] { "Received", "Issued", "Transferred", "Adjusted" };
        if (!validTypes.Contains(transactionType))
            throw new ArgumentException($"Invalid transaction type. Must be one of: {string.Join(", ", validTypes)}", nameof(transactionType));

        // For issued/transferred transactions, validate sufficient quantity
        if ((transactionType == "Issued" || transactionType == "Transferred") && quantity > 0)
        {
            if (stockItem.Quantity < quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {stockItem.Quantity}, Requested: {quantity}");
        }

        var transaction = new StockTransaction
        {
            StockItemId = stockItemId,
            TransactionDate = transactionDate,
            TransactionType = transactionType.Trim(),
            Quantity = quantity,
            IssuedTo = string.IsNullOrWhiteSpace(issuedTo) ? null : issuedTo.Trim(),
            IssuedBy = string.IsNullOrWhiteSpace(issuedBy) ? null : issuedBy.Trim(),
            ReceivedFrom = string.IsNullOrWhiteSpace(receivedFrom) ? null : receivedFrom.Trim(),
            ReferenceNumber = string.IsNullOrWhiteSpace(referenceNumber) ? null : referenceNumber.Trim(),
            BatchNumber = string.IsNullOrWhiteSpace(batchNumber) ? null : batchNumber.Trim(),
            ExpiryDate = expiryDate,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            RecordedBy = recordedBy.Trim()
        };

        await stockTransactionRepository.AddAsync(transaction, cancellationToken);

        // Update stock item quantity based on transaction type
        if (transactionType == "Received")
        {
            stockItem.Quantity += quantity;
        }
        else if (transactionType == "Issued" || transactionType == "Transferred")
        {
            stockItem.Quantity -= quantity;
        }
        // For Adjusted, we assume the quantity in the transaction is the new absolute quantity
        else if (transactionType == "Adjusted")
        {
            stockItem.Quantity = quantity;
        }

        await stockItemRepository.UpdateAsync(stockItem, cancellationToken);
        return transaction;
    }
}