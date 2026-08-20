namespace SchoolManagement.Domain.Academic;

public sealed class Curriculum
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; init; }
    public required string Version { get; init; }
    public required string Title { get; init; }
    public int MinimumCredits { get; init; }
    public DateOnly EffectiveFrom { get; init; }
    public DateOnly? EffectiveTo { get; init; }
    public string Status { get; set; } = "Draft";
    public bool IsActive { get; set; } = true;
}
