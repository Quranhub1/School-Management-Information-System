namespace SchoolManagement.Domain.Academic;

public sealed class Curriculum
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; set; }
    public required string Version { get; set; }
    public required string Title { get; set; }
    public int MinimumCredits { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public ProgrammeType ProgrammeType { get; set; } = ProgrammeType.FullProgramme;
    public string Status { get; set; } = "Draft";
    public bool IsActive { get; set; } = true;
}
