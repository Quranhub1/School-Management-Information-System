namespace SchoolManagement.Domain.Finance;

public sealed class JournalEntryLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid JournalEntryId { get; init; }
    public Guid AccountId { get; init; }
    public string? Description { get; init; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public JournalEntry? JournalEntry { get; init; }
    public Account? Account { get; init; }
}
