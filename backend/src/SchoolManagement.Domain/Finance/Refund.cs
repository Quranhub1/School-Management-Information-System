namespace SchoolManagement.Domain.Finance;

public sealed class Refund
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid PaymentId { get; init; }
    public Guid? CreditNoteId { get; init; }
    public required string RefundNumber { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required string RefundMethod { get; init; }
    public string? Reference { get; init; }
    public required string Reason { get; init; }
    public string Status { get; set; } = "Completed";
    public DateTimeOffset RefundedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? RefundedBy { get; init; }
}
