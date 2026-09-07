namespace SchoolManagement.Domain.Academic;

public sealed class Stream
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public required string Code { get; set; }
    public Guid AcademicClassId { get; set; }
    public string? ClassFormId { get; set; }
    public bool IsActive { get; set; } = true;
}
