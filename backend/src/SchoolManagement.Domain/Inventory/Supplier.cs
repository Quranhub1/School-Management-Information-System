namespace SchoolManagement.Domain.Inventory;

public sealed class Supplier
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public required string Category { get; set; } // e.g., Food, Stationery, Cleaning, etc.
    public bool IsActive { get; set; } = true;
}