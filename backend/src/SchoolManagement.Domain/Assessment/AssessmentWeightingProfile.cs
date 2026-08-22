namespace SchoolManagement.Domain.Assessment;

public sealed class AssessmentWeightingProfile
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public string? RegulatoryBody { get; init; }
    public string? AssessmentModel { get; init; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime EffectiveFromUtc { get; init; } = DateTime.UtcNow;
    public DateTime? EffectiveToUtc { get; set; }
}
