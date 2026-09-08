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

    public void Reopen(string reopenedBy)
    {
        if (string.IsNullOrWhiteSpace(reopenedBy)) throw new ArgumentException("Reopening user identity is required.", nameof(reopenedBy));
        if (!string.Equals(Status, "Closed", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only a closed fiscal period can be reopened.");
        Status = "Open";
        ClosedAt = null;
        ClosedBy = null;
    }

    public bool Contains(DateOnly date) => date >= StartDate && date <= EndDate;
}
