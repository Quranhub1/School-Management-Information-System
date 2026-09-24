namespace SchoolManagement.Domain.Inventory;

public sealed class WelfareCommodity
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Category { get; set; }
    public required string Unit { get; set; }
    public decimal ReorderLevel { get; set; }
    public bool IsActive { get; set; } = true;
}