namespace SchoolManagement.Domain.Library;

public sealed class LibraryLoan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookId { get; set; }
    public Guid StudentId { get; set; }
    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime DueAtUtc { get; set; }
    public DateTime? ReturnedAtUtc { get; set; }
    public decimal FineAmount { get; set; }

    public bool IsActive => !ReturnedAtUtc.HasValue;
    public bool IsOverdue(DateTime utcNow) => IsActive && utcNow > DueAtUtc;
}
