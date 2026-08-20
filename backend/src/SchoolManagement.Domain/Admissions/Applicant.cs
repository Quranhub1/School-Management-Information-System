namespace SchoolManagement.Domain.Admissions;

/// <summary>
/// A person seeking admission before becoming an enrolled student.
/// </summary>
public sealed class Applicant
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ApplicationNumber { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public string? OtherNames { get; init; }
    public DateOnly? DateOfBirth { get; init; }
    public string? Gender { get; init; }
    public string? NationalId { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public string Status { get; set; } = "Submitted";
    public DateTimeOffset AppliedAt { get; init; } = DateTimeOffset.UtcNow;
}
