namespace SchoolManagement.Domain.Library;

public sealed class LibraryStudentPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RequirementId { get; set; }
    public Guid StudentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "UGX";
    public string PaymentMethod { get; set; } = "Cash";
    public string? Reference { get; set; }
    public DateTimeOffset RecordedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public string? RecordedBy { get; set; }
}
