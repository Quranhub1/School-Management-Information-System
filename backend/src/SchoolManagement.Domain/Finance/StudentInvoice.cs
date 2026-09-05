namespace SchoolManagement.Domain.Finance;

public sealed class StudentInvoice
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? FeeStructureId { get; init; }
    public required string InvoiceNumber { get; init; }
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Currency { get; init; } = "UGX";
    public required string Status { get; set; }
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<StudentInvoiceLine> Lines { get; set; } = new List<StudentInvoiceLine>();
    public ICollection<InvoiceDiscount> Discounts { get; set; } = new List<InvoiceDiscount>();
    public ICollection<InvoiceInstallment> Installments { get; set; } = new List<InvoiceInstallment>();

    public decimal NetAmount => Math.Max(0, Amount - DiscountAmount);
    public decimal OutstandingAmount => Math.Max(0, NetAmount - PaidAmount);
}
