namespace SchoolManagement.Domain.Finance;

public sealed class SchoolPayTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? StudentInvoiceId { get; init; }
    public required string TransactionRef { get; init; }
    public required string Provider { get; init; }
    public required string PhoneNumber { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string Status { get; set; } = "Pending";
    public string? ExternalRef { get; set; }
    public string? ErrorMessage { get; init; }
    public string? Reference { get; set; }
    public DateTimeOffset RequestedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }
}