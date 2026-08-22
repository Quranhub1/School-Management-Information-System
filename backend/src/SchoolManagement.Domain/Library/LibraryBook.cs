namespace SchoolManagement.Domain.Library;

public sealed class LibraryBook
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Isbn { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public bool IsActive { get; set; } = true;
}
