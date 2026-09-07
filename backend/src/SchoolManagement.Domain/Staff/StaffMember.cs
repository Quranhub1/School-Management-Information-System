namespace SchoolManagement.Domain.Staff;

/// <summary>
/// Institutional staff identity, kept separate from authentication credentials.
/// </summary>
public sealed class StaffMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string StaffNumber { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? OtherNames { get; set; }
    public string? NationalId { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? DepartmentId { get; set; }
    public required string EmploymentType { get; set; }
    public required SchoolManagement.Domain.Staff.StaffType StaffType { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public DateOnly? DateJoined { get; set; }
    public bool IsActive { get; set; } = true;
}
