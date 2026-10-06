using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Infrastructure.Inventory;

public sealed class StockTransactionRepository(SchoolManagementDbContext db) : IStockTransactionRepository
{
    public async Task<IReadOnlyList<StockTransaction>> GetStockTransactionsAsync(
        Guid? stockItemId = null,
        DateOnly? fromDate = null,
        DateOnly? toDate = null,
        string? transactionType = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.Set<StockTransaction>().AsNoTracking().AsQueryable();

        if (stockItemId.HasValue)
            query = query.Where(x => x.StockItemId == stockItemId.Value);

        if (fromDate.HasValue)
            query = query.Where(x => x.TransactionDate >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(x => x.TransactionDate <= toDate.Value);

        if (!string.IsNullOrWhiteSpace(transactionType))
            query = query.Where(x => x.TransactionType == transactionType.Trim());

        return await query.OrderByDescending(x => x.TransactionDate).ToListAsync(cancellationToken);
    }

    public Task<StockTransaction?> GetStockTransactionAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<StockTransaction>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(StockTransaction entity, CancellationToken cancellationToken = default) =>
        db.Set<StockTransaction>().AddAsync(entity, cancellationToken).AsTask();
}