namespace SchoolManagement.Domain.Finance;

public sealed class StudentInvoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid? FeeStructureId { get; set; }
    public required string InvoiceNumber { get; set; }
    public string FeeType { get; set; } = "Tuition";
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Currency { get; set; } = "UGX";
    public required string Status { get; set; }
    public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<StudentInvoiceLine> Lines { get; set; } = new List<StudentInvoiceLine>();
    public ICollection<InvoiceDiscount> Discounts { get; set; } = new List<InvoiceDiscount>();
    public ICollection<InvoiceInstallment> Installments { get; set; } = new List<InvoiceInstallment>();

    public decimal NetAmount => Math.Max(0, Amount - DiscountAmount);
    public decimal OutstandingAmount => Math.Max(0, NetAmount - PaidAmount);
}
