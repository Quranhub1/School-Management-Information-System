namespace SchoolManagement.Domain.Academic;

public sealed class Programme
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DepartmentId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Award { get; init; }
    public int DurationYears { get; init; }
    public bool IsActive { get; set; } = true;
}
