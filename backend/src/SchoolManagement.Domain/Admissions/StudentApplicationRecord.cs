namespace SchoolManagement.Domain.Admissions;

/// <summary>Full application-form submission linked to a student profile.</summary>
public sealed class StudentApplicationRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public required string ApplicationDataJson { get; set; }
    public byte[]? PhotographData { get; set; }
    public string? PhotographContentType { get; set; }
    public string? PhotographFileName { get; set; }
    public DateTimeOffset SubmittedAt { get; init; } = DateTimeOffset.UtcNow;
    public string Status { get; set; } = "Submitted";
}
