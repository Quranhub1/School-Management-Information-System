using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Inventory;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Inventory;

public sealed class WelfareInventoryService(SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<CommodityDto>> GetCommoditiesAsync(CancellationToken ct)
        => await db.WelfareCommodities.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(x => new CommodityDto(x.Id, x.Name, x.Category, x.Unit, x.ReorderLevel)).ToListAsync(ct);

    public async Task<IReadOnlyList<DailyWelfareRowDto>> GetDailySheetAsync(DateOnly? from, DateOnly? to, Guid? commodityId, CancellationToken ct)
    {
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var start = from ?? end.AddDays(-30);
        var tx = await db.WelfareStockTransactions.AsNoTracking()
            .Where(x => x.TransactionDate >= start && x.TransactionDate <= end && (!commodityId.HasValue || x.CommodityId == commodityId.Value))
            .Join(db.WelfareCommodities.AsNoTracking(), x => x.CommodityId, c => c.Id, (x,c) => new { x, c })
            .OrderByDescending(x => x.x.TransactionDate).ThenBy(x => x.c.Name).ToListAsync(ct);
        var result = new List<DailyWelfareRowDto>();
        foreach (var group in tx.GroupBy(x => new { x.x.TransactionDate, x.c.Id, x.c.Name, x.c.Unit, x.c.ReorderLevel }).OrderByDescending(x => x.Key.TransactionDate).ThenBy(x => x.Key.Name))
        {
            var opening = await GetBalanceBeforeAsync(group.Key.Id, group.Key.TransactionDate, ct);
            var received = group.Where(x => x.x.TransactionType == "Receipt").Sum(x => x.x.Quantity);
            var used = group.Where(x => x.x.TransactionType == "Consumption").Sum(x => x.x.Quantity);
            var wastage = group.Where(x => x.x.TransactionType == "Wastage").Sum(x => x.x.Quantity);
            var adjustment = group.Where(x => x.x.TransactionType == "Adjustment").Sum(x => x.x.Quantity);
            result.Add(new DailyWelfareRowDto(group.Key.TransactionDate, group.Key.Id, group.Key.Name, group.Key.Unit, opening, received, used, wastage, adjustment, opening + received - used - wastage + adjustment, group.Key.ReorderLevel));
        }
        return result;
    }

    public async Task<StockBalanceDto> GetBalanceAsync(Guid commodityId, CancellationToken ct)
    {
        var commodity = await db.WelfareCommodities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == commodityId, ct) ?? throw new KeyNotFoundException("Welfare commodity was not found.");
        var balance = await GetBalanceBeforeAsync(commodityId, null, ct);
        return new StockBalanceDto(commodity.Id, commodity.Name, commodity.Unit, balance, commodity.ReorderLevel, balance <= commodity.ReorderLevel);
    }

    public async Task<CommodityDto> CreateCommodityAsync(string name, string category, string unit, decimal reorderLevel, CancellationToken ct)
    {
        name = name.Trim(); category = category.Trim(); unit = unit.Trim();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(unit)) throw new ArgumentException("Name, category and unit are required.");
        if (reorderLevel < 0) throw new ArgumentException("Reorder level cannot be negative.");
        if (await db.WelfareCommodities.AnyAsync(x => x.Name.ToLower() == name.ToLower(), ct)) throw new InvalidOperationException("A commodity with this name already exists.");
        var item = new WelfareCommodity { Name = name, Category = category, Unit = unit, ReorderLevel = reorderLevel };
        db.WelfareCommodities.Add(item); await db.SaveChangesAsync(ct);
        return new CommodityDto(item.Id, item.Name, item.Category, item.Unit, item.ReorderLevel);
    }

    public async Task<TransactionDto> RecordAsync(Guid commodityId, DateOnly date, string type, decimal quantity, string? supplier, string? reference, string? batchNumber, DateOnly? expiryDate, string? notes, string recordedBy, CancellationToken ct)
    {
        var commodity = await db.WelfareCommodities.SingleOrDefaultAsync(x => x.Id == commodityId && x.IsActive, ct) ?? throw new KeyNotFoundException("Welfare commodity was not found.");
        type = type.Trim();
        if (!new[] { "Receipt", "Consumption", "Wastage", "Adjustment" }.Contains(type, StringComparer.OrdinalIgnoreCase)) throw new ArgumentException("Transaction type must be Receipt, Consumption, Wastage or Adjustment.");
        if (quantity == 0) throw new ArgumentException("Quantity cannot be zero.");
        if (!type.Equals("Adjustment", StringComparison.OrdinalIgnoreCase) && quantity < 0) throw new ArgumentException("Quantity must be positive for receipts, consumption and wastage.");
        var signed = type.Equals("Adjustment", StringComparison.OrdinalIgnoreCase) ? quantity : (type.Equals("Receipt", StringComparison.OrdinalIgnoreCase) ? quantity : -quantity);
        var balance = await GetBalanceBeforeAsync(commodityId, null, ct);
        if (balance + signed < 0) throw new InvalidOperationException($"Insufficient {commodity.Name} stock. Available balance is {balance:0.###} {commodity.Unit}.");
        var item = new WelfareStockTransaction { CommodityId = commodityId, TransactionDate = date, TransactionType = char.ToUpper(type[0]) + type[1..].ToLowerInvariant(), Quantity = type.Equals("Adjustment", StringComparison.OrdinalIgnoreCase) ? quantity : Math.Abs(quantity), Supplier = supplier?.Trim(), Reference = reference?.Trim(), BatchNumber = batchNumber?.Trim(), ExpiryDate = expiryDate, Notes = notes?.Trim(), RecordedBy = recordedBy };
        db.WelfareStockTransactions.Add(item); await db.SaveChangesAsync(ct);
        return new TransactionDto(item.Id, commodity.Name, item.TransactionDate, item.TransactionType, item.Quantity, item.Supplier, item.Reference, item.BatchNumber, item.ExpiryDate, item.Notes, item.RecordedBy);
    }

    private async Task<decimal> GetBalanceBeforeAsync(Guid commodityId, DateOnly? beforeDate, CancellationToken ct)
    {
        var q = db.WelfareStockTransactions.AsNoTracking().Where(x => x.CommodityId == commodityId);
        if (beforeDate.HasValue) q = q.Where(x => x.TransactionDate < beforeDate.Value);
        var tx = await q.Select(x => new { x.TransactionType, x.Quantity }).ToListAsync(ct);
        return tx.Sum(x => x.TransactionType == "Receipt" ? x.Quantity : x.TransactionType == "Adjustment" ? x.Quantity : -x.Quantity);
    }
}
public sealed record CommodityDto(Guid Id, string Name, string Category, string Unit, decimal ReorderLevel);
public sealed record StockBalanceDto(Guid Id, string Name, string Unit, decimal Balance, decimal ReorderLevel, bool LowStock);
public sealed record DailyWelfareRowDto(DateOnly Date, Guid CommodityId, string Commodity, string Unit, decimal Opening, decimal Received, decimal Used, decimal Wastage, decimal Adjustment, decimal Balance, decimal ReorderLevel);
public sealed record TransactionDto(Guid Id, string Commodity, DateOnly Date, string Type, decimal Quantity, string? Supplier, string? Reference, string? BatchNumber, DateOnly? ExpiryDate, string? Notes, string RecordedBy);