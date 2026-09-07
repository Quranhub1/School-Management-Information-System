namespace SchoolManagement.Domain.Finance;

public sealed class FiscalPeriod
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public string Status { get; private set; } = "Open";
    public DateTimeOffset? ClosedAt { get; private set; }
    public string? ClosedBy { get; private set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public void Close(string closedBy)
    {
        if (string.IsNullOrWhiteSpace(closedBy)) throw new ArgumentException("Closing user identity is required.", nameof(closedBy));
        if (!string.Equals(Status, "Open", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only an open fiscal period can be closed.");
        Status = "Closed";
        ClosedAt = DateTimeOffset.UtcNow;
        ClosedBy = closedBy.Trim();
    }

    public bool Contains(DateOnly date) => date >= StartDate && date <= EndDate;
}
