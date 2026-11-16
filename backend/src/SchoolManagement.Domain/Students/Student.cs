using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.People;

namespace SchoolManagement.Domain.Students;

public sealed class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string StudentNumber { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? OtherNames { get; set; }
    [NotMapped, JsonPropertyName("displayName")]
    public string DisplayName => PersonName.Format(LastName, FirstName, OtherNames);
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? NationalId { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public string? ArchivedBy { get; set; }
    public string? ArchiveReason { get; set; }
    public string? StatusBeforeArchive { get; set; }
    public Guid? AdmissionId { get; set; }
    public Guid? CampusId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<StudentCharge> FinanceCharges { get; set; } = new List<StudentCharge>();
}
