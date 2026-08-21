namespace SchoolManagement.Domain.Students;

/// <summary>
/// Registration of a student for an individual course/module within a semester.
/// </summary>
public sealed class CourseRegistration
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid RegistrationId { get; init; }
    public Guid CourseId { get; init; }
    public string Status { get; set; } = "Registered";
    public bool IsCore { get; init; }
    public DateTimeOffset RegisteredAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DroppedAt { get; set; }
    public string? DropReason { get; set; }
}
