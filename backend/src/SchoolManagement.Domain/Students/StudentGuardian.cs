namespace SchoolManagement.Domain.Students;

public sealed class StudentGuardian
{
    public Guid StudentId { get; init; }
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string FullName { get; set; }
    public string? Relationship { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsPrimary { get; set; }
}
