namespace SchoolManagement.Domain.Inventory;

public sealed class StockItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Category { get; set; }
    public required string Unit { get; set; }
    public decimal Quantity { get; set; }
    public decimal ReorderLevel { get; set; }
    public string? Location { get; set; }
    public string? SupplierId { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}