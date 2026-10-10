namespace SchoolManagement.Domain.Inventory;

public sealed class InventoryRegister
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string SectionId { get; set; }
    public required string ColumnsJson { get; set; }
    public required string RowsJson { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public required string UpdatedBy { get; set; }
}
