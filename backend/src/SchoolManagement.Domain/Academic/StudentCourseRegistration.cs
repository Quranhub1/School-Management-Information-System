namespace SchoolManagement.Domain.Academic;

public enum RegistrationStatus
{
    Registered,
    Dropped,
    Withdrawn
}

public sealed class StudentCourseRegistration
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseOfferingId { get; init; }
    public RegistrationStatus Status { get; set; } = RegistrationStatus.Registered;
    public DateTime RegisteredAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? DroppedAtUtc { get; set; }
    public CourseOffering? CourseOffering { get; init; }
}
