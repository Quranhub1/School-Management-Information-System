using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using SchoolManagement.Domain.People;

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
    [NotMapped, JsonPropertyName("displayName")]
    public string DisplayName => PersonName.Format(LastName, FirstName, OtherNames);
    public string? NationalId { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? CampusId { get; set; }
    public Guid? UserId { get; set; }
    public string? JobTitle { get; set; }
    public string? HighestQualification { get; set; }
    public string? Speciality { get; set; }
    public string? ProfessionalRegistration { get; set; }
    public string CourseUnitIdsJson { get; set; } = "[]";
    public required string EmploymentType { get; set; }
    public required SchoolManagement.Domain.Staff.StaffType StaffType { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public DateOnly? DateJoined { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAddress { get; set; }
    public decimal? BasicSalary { get; set; }
    public string? AttendanceMode { get; set; }
    public string? PhotographDataUrl { get; set; }
    public bool IsActive { get; set; } = true;
}
