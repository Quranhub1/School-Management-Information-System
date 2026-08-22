namespace SchoolManagement.Domain.Assessment;

public sealed class AssessmentWeightingComponent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AssessmentWeightingProfileId { get; init; }
    public required string Name { get; init; }
    public required string AssessmentType { get; init; }
    public decimal WeightPercentage { get; init; }
    public decimal MaximumMark { get; init; } = 100m;
    public bool IsRequired { get; init; } = true;
    public bool IsActive { get; set; } = true;
}
