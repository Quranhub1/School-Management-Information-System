namespace SchoolManagement.Domain.Inventory;

public sealed class StockTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StockItemId { get; init; }
    public DateOnly TransactionDate { get; init; }
    public required string TransactionType { get; init; } // Received, Issued, Transferred, Adjusted
    public decimal Quantity { get; init; }
    public string? IssuedTo { get; init; } // Department, Person, etc.
    public string? IssuedBy { get; init; } // Who issued the stock
    public string? ReceivedFrom { get; init; } // Supplier or source
    public string? ReferenceNumber { get; init; } // PO#, Invoice#, etc.
    public string? BatchNumber { get; init; }
    public DateOnly? ExpiryDate { get; init; }
    public string? Notes { get; init; }
    public required string RecordedBy { get; init; } // User who recorded the transaction
}