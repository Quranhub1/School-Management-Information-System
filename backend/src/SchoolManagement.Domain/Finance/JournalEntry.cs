namespace SchoolManagement.Domain.Finance;

public sealed class JournalEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EntryNumber { get; init; }
    public DateTimeOffset EntryDate { get; init; } = DateTimeOffset.UtcNow;
    public string? Description { get; init; }
    public string Status { get; init; } = "Draft";
    public DateTimeOffset? PostedAt { get; init; }
    public string? PostedBy { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
}
