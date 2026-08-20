namespace SchoolManagement.Domain.Academic;

public sealed class CourseRegistration
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid CourseId { get; init; }
    public Guid SemesterId { get; init; }
    public required string Status { get; set; }
    public DateTimeOffset RegisteredAt { get; init; } = DateTimeOffset.UtcNow;
}
