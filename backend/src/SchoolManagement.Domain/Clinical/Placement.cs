namespace SchoolManagement.Domain.Clinical;

public sealed class Placement
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public string? FacilityName { get; init; }
    public string? FacilityType { get; init; }
    public string? SupervisorName { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public required string Status { get; set; }
}
