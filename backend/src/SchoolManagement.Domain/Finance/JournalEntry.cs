namespace SchoolManagement.Domain.Finance;

public sealed class JournalEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EntryNumber { get; init; }
    public DateTimeOffset EntryDate { get; init; } = DateTimeOffset.UtcNow;
    public string? Description { get; init; }
    public string Status { get; set; } = "Draft";
    public DateTimeOffset? PostedAt { get; set; }
    public string? PostedBy { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? SourceType { get; init; }
    public Guid? SourceId { get; init; }
    public Guid? ReversalOfJournalEntryId { get; init; }
    public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();

    public void ValidateForPosting()
    {
        if (Lines.Count < 2)
            throw new InvalidOperationException("A journal entry must contain at least two lines.");

        foreach (var line in Lines)
        {
            if (line.Debit < 0 || line.Credit < 0)
                throw new InvalidOperationException("Journal debit and credit amounts cannot be negative.");

            if (line.Debit > 0 && line.Credit > 0)
                throw new InvalidOperationException("A journal line cannot contain both a debit and a credit.");

            if (line.Debit == 0 && line.Credit == 0)
                throw new InvalidOperationException("A journal line must contain either a debit or a credit.");
        }

        var debits = Lines.Sum(x => x.Debit);
        var credits = Lines.Sum(x => x.Credit);
        if (debits != credits)
            throw new InvalidOperationException($"Journal entry is unbalanced: debits {debits:0.00} must equal credits {credits:0.00}.");
    }

    public void Post(string postedBy)
    {
        if (string.IsNullOrWhiteSpace(postedBy))
            throw new ArgumentException("Posted-by user is required.", nameof(postedBy));

        ValidateForPosting();
        if (!string.Equals(Status, "Draft", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only draft journal entries can be posted.");

        Status = "Posted";
        PostedAt = DateTimeOffset.UtcNow;
        PostedBy = postedBy.Trim();
    }
}
