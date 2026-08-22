namespace SchoolManagement.Domain.Library;

public sealed class Librarian
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StaffMemberId { get; init; }
    public required string LibraryRole { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? DeactivatedAtUtc { get; set; }
}
