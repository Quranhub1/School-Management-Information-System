namespace SchoolManagement.Domain.Finance;

public sealed class FiscalPeriod
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public string Status { get; private set; } = "Open";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ClosedAt { get; private set; }
    public string? ClosedBy { get; private set; }

    public void Validate()
    {
        if (StartDate > EndDate) throw new InvalidOperationException("Fiscal period start date cannot be after end date.");
        if (string.IsNullOrWhiteSpace(Code)) throw new InvalidOperationException("Fiscal period code is required.");
    }

    public void Close(string user)
    {
        if (string.IsNullOrWhiteSpace(user)) throw new ArgumentException("Closing user is required.", nameof(user));
        if (Status != "Open") throw new InvalidOperationException("Only open fiscal periods can be closed.");
        Status = "Closed"; ClosedAt = DateTimeOffset.UtcNow; ClosedBy = user.Trim();
    }

    public void Reopen(string user)
    {
        if (string.IsNullOrWhiteSpace(user)) throw new ArgumentException("User is required.", nameof(user));
        if (Status != "Closed") throw new InvalidOperationException("Only closed fiscal periods can be reopened.");
        Status = "Open"; ClosedAt = null; ClosedBy = null;
    }
}
