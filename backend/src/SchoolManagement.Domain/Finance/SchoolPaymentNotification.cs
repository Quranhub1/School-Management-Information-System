namespace SchoolManagement.Domain.Finance;

public sealed class SchoolPaymentNotification
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ExternalReference { get; init; }
    public required string SchoolPayReference { get; init; }
    public Guid? StudentId { get; init; }
    public Guid? StudentInvoiceId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string? Channel { get; init; }
    public string Status { get; set; } = "Pending";
    public string? PhoneNumber { get; init; }
    public string? PayerName { get; init; }
    public string? ErrorMessage { get; set; }
    public string? RawPayload { get; init; }
    public DateTimeOffset ReceivedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
}
