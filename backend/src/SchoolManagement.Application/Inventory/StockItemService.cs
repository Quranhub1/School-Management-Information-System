using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Application.Inventory;

public sealed class StockItemService(
    IStockItemRepository stockItemRepository,
    ISupplierRepository supplierRepository)
{
    public Task<IReadOnlyList<StockItem>> GetStockItemsAsync(CancellationToken cancellationToken = default) =>
        stockItemRepository.GetStockItemsAsync(cancellationToken);

    public Task<StockItem?> GetStockItemAsync(Guid id, CancellationToken cancellationToken = default) =>
        stockItemRepository.GetStockItemAsync(id, cancellationToken);

    public async Task<StockItem> CreateStockItemAsync(
        string name,
        string category,
        string unit,
        decimal quantity,
        decimal reorderLevel,
        string? location,
        Guid? supplierId,
        DateOnly? expiryDate,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Stock item name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Stock item category is required.", nameof(category));
        if (string.IsNullOrWhiteSpace(unit)) throw new ArgumentException("Stock item unit is required.", nameof(unit));
        if (quantity < 0) throw new ArgumentException("Quantity cannot be negative.", nameof(quantity));
        if (reorderLevel < 0) throw new ArgumentException("Reorder level cannot be negative.", nameof(reorderLevel));

        var stockItem = new StockItem
        {
            Name = name.Trim(),
            Category = category.Trim(),
            Unit = unit.Trim(),
            Quantity = quantity,
            ReorderLevel = reorderLevel,
            Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim(),
            SupplierId = supplierId,
            ExpiryDate = expiryDate,
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            IsActive = true
        };

        await stockItemRepository.AddAsync(stockItem, cancellationToken);
        return stockItem;
    }

    public async Task<StockItem> UpdateStockItemAsync(
        Guid id,
        string name,
        string category,
        string unit,
        decimal quantity,
        decimal reorderLevel,
        string? location,
        Guid? supplierId,
        DateOnly? expiryDate,
        string? description,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var existing = await stockItemRepository.GetStockItemAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Stock item with ID {id} not found.");

        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Stock item name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Stock item category is required.", nameof(category));
        if (string.IsNullOrWhiteSpace(unit)) throw new ArgumentException("Stock item unit is required.", nameof(unit));
        if (quantity < 0) throw new ArgumentException("Quantity cannot be negative.", nameof(quantity));
        if (reorderLevel < 0) throw new ArgumentException("Reorder level cannot be negative.", nameof(reorderLevel));

        existing.Name = name.Trim();
        existing.Category = category.Trim();
        existing.Unit = unit.Trim();
        existing.Quantity = quantity;
        existing.ReorderLevel = reorderLevel;
        existing.Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim();
        existing.SupplierId = supplierId;
        existing.ExpiryDate = expiryDate;
        existing.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        existing.IsActive = isActive;

        await stockItemRepository.UpdateAsync(existing, cancellationToken);
        return existing;
    }

    public async Task DeleteStockItemAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await stockItemRepository.GetStockItemAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Stock item with ID {id} not found.");

        await stockItemRepository.DeleteAsync(id, cancellationToken);
    }

    public Task<IReadOnlyList<StockItem>> GetLowStockItemsAsync(CancellationToken cancellationToken = default) =>
        stockItemRepository.GetLowStockItemsAsync(cancellationToken);
}