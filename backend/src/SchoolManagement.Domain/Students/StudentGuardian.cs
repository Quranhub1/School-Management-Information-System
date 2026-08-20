namespace SchoolManagement.Domain.Students;

public sealed class StudentGuardian
{
    public Guid StudentId { get; init; }
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string FullName { get; init; }
    public string? Relationship { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public bool IsPrimary { get; init; }
}
