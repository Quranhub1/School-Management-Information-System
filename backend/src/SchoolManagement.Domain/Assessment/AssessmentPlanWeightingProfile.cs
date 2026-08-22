namespace SchoolManagement.Domain.Assessment;

public sealed class AssessmentPlanWeightingProfile
{
    public Guid AssessmentPlanId { get; init; }
    public Guid AssessmentWeightingProfileId { get; init; }
    public DateTime EffectiveFromUtc { get; init; } = DateTime.UtcNow;
    public DateTime? EffectiveToUtc { get; set; }
}
