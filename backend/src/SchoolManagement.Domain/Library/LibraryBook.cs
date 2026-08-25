namespace SchoolManagement.Domain.Library;

public sealed class LibraryBook
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Isbn { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public int TotalCopies { get; private set; }
    public int AvailableCopies { get; private set; }
    public bool IsActive { get; private set; } = true;

    public void SetInventory(int totalCopies, int? availableCopies = null)
    {
        if (totalCopies < 0) throw new ArgumentOutOfRangeException(nameof(totalCopies));
        var available = availableCopies ?? totalCopies;
        if (available < 0 || available > totalCopies) throw new ArgumentOutOfRangeException(nameof(availableCopies));
        TotalCopies = totalCopies;
        AvailableCopies = available;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}
