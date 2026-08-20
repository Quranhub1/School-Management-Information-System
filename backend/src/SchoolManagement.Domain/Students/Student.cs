namespace SchoolManagement.Domain.Students;

public sealed class Student
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string StudentNumber { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public string? OtherNames { get; init; }
    public DateOnly? DateOfBirth { get; init; }
    public string? Gender { get; init; }
    public string? NationalId { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
