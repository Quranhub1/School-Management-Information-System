namespace SchoolManagement.Domain.Finance;

public sealed class StudentInvoice
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? FeeStructureId { get; init; }
    public required string InvoiceNumber { get; init; }
    public decimal Amount { get; init; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; init; } = "UGX";
    public required string Status { get; set; }
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<StudentFee> StudentFees { get; set; } = new List<StudentFee>();
}
