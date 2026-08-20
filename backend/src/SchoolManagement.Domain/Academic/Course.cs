namespace SchoolManagement.Domain.Academic;

public sealed class Course
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; init; }
    public int CreditUnits { get; init; }
    public string? Description { get; init; }
    public string? CourseType { get; init; }
    public bool IsActive { get; set; } = true;
}
