using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Application.Abstractions;

public interface IStockItemRepository
{
    Task<IReadOnlyList<StockItem>> GetStockItemsAsync(CancellationToken cancellationToken = default);
    Task<StockItem?> GetStockItemAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(StockItem entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(StockItem entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StockItem>> GetLowStockItemsAsync(CancellationToken cancellationToken = default);
}

public interface IStockTransactionRepository
{
    Task<IReadOnlyList<StockTransaction>> GetStockTransactionsAsync(
        Guid? stockItemId = null,
        DateOnly? fromDate = null,
        DateOnly? toDate = null,
        string? transactionType = null,
        CancellationToken cancellationToken = default);
    Task<StockTransaction?> GetStockTransactionAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(StockTransaction entity, CancellationToken cancellationToken = default);
}

public interface ISupplierRepository
{
    Task<IReadOnlyList<Supplier>> GetSuppliersAsync(CancellationToken cancellationToken = default);
    Task<Supplier?> GetSupplierAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(Supplier entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Supplier entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}