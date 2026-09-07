namespace SchoolManagement.Domain.Finance;

public sealed class Sponsorship
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? SponsorId { get; init; }
    public required string SponsorName { get; init; }
    public string? SponsorContact { get; init; }
    public string? SponsorEmail { get; init; }
    public string? SponsorPhone { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string Type { get; init; } = "Full";
    public string Status { get; init; } = "Active";
    public DateOnly? StartDate { get; init; }
    public DateOnly? EndDate { get; init; }
    public string? Notes { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
