namespace SchoolManagement.Domain.Inventory;

public sealed class WelfareStockTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CommodityId { get; init; }
    public DateOnly TransactionDate { get; init; }
    public required string TransactionType { get; init; } // Receipt, Consumption, Wastage, Adjustment
    public decimal Quantity { get; init; }
    public string? Supplier { get; init; }
    public string? Reference { get; init; }
    public string? BatchNumber { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? Notes { get; init; }
    public required string RecordedBy { get; init; }
}