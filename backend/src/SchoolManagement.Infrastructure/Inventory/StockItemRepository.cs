using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Infrastructure.Inventory;

public sealed class StockItemRepository(SchoolManagementDbContext db) : IStockItemRepository
{
    public async Task<IReadOnlyList<StockItem>> GetStockItemsAsync(CancellationToken cancellationToken = default) =>
        await db.Set<StockItem>().AsNoTracking().ToListAsync(cancellationToken);

    public Task<StockItem?> GetStockItemAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<StockItem>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(StockItem entity, CancellationToken cancellationToken = default) =>
        db.Set<StockItem>().AddAsync(entity, cancellationToken).AsTask();

    public Task UpdateAsync(StockItem entity, CancellationToken cancellationToken = default)
    {
        db.Set<StockItem>().Update(entity);
        return db.SaveChangesAsync(cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        db.Set<StockItem>().Remove(new StockItem { Id = id });
        return db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StockItem>> GetLowStockItemsAsync(CancellationToken cancellationToken = default) =>
        await db.Set<StockItem>()
            .Where(x => x.Quantity <= x.ReorderLevel && x.IsActive)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
}