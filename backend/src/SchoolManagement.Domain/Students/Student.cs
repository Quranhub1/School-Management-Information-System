using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Domain.Students;

public sealed class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string StudentNumber { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? OtherNames { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? NationalId { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = "Active";
    public Guid? AdmissionId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<StudentCharge> FinanceCharges { get; set; } = new List<StudentCharge>();
}
