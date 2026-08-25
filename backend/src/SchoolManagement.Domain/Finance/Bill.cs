namespace SchoolManagement.Domain.Finance;

public sealed class Bill
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid VendorId { get; init; }
    public required string BillNumber { get; init; }
    public DateTimeOffset BillDate { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DueDate { get; init; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; init; } = "UGX";
    public string Status { get; init; } = "Pending";
    public string? Description { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<BillPayment> Payments { get; set; } = new List<BillPayment>();
}
