using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Domain.Finance;

public sealed class InvoiceDiscount
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public required string DiscountType { get; init; }
    [Precision(5, 2)]
    public decimal? Percentage { get; init; }
    [Precision(18, 2)]
    public decimal Amount { get; set; }
    public required string Reason { get; init; }
    public required string Status { get; set; }
    public string? RequestedBy { get; init; }
    public string? ApprovedBy { get; set; }
    public DateTimeOffset RequestedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ApprovedAt { get; set; }
    public Guid? ApprovalJournalEntryId { get; set; }
}
