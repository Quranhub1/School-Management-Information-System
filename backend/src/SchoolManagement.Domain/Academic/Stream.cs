namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A stream or subdivision within an academic class.
/// Allows splitting a class into smaller groups (e.g. Stream A, Stream B).
/// </summary>
public sealed class Stream
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AcademicClassId { get; init; }
    public required string Code { get; init; }
    public string? Name { get; init; }
    public int? Capacity { get; init; }
    public bool IsActive { get; set; } = true;
}
