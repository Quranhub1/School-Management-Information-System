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

    // Optional accounting dimensions. A null dimension means the posting is
    // institution-wide rather than scoped to that organizational level.
    public Guid? CampusId { get; init; }
    public Guid? FacultyId { get; init; }
    public Guid? DepartmentId { get; init; }
    public Guid? ProgrammeId { get; init; }

    public JournalEntry? JournalEntry { get; init; }
    public Account? Account { get; init; }
}
