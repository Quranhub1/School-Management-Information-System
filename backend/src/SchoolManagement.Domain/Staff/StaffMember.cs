namespace SchoolManagement.Domain.Staff;

public sealed class StaffMember
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string StaffNumber { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public string? NationalId { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public required string EmploymentType { get; init; }
    public bool IsActive { get; set; } = true;
}
