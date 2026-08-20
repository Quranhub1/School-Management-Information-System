namespace SchoolManagement.Domain.Academic;

public sealed class Intake
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public required string Code { get; init; }
    public DateOnly StartDate { get; init; }
    public bool IsOpen { get; set; } = true;
}
