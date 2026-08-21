namespace SchoolManagement.Domain.Assessment;

public enum AssessmentAuthority
{
    Institutional = 1,
    Uhpab = 2,
    Uvtab = 3
}

public enum AssessmentModel
{
    Academic = 1,
    CompetencyBased = 2,
    Hybrid = 3
}

public sealed class ProgrammeAssessmentProfile
{
    public Guid Id { get; set; }
    public Guid ProgrammeId { get; set; }
    public AssessmentAuthority Authority { get; set; }
    public AssessmentModel Model { get; set; }
    public bool ContinuousAssessmentRequired { get; set; }
    public bool TheoryAssessmentRequired { get; set; }
    public bool PracticalAssessmentRequired { get; set; }
    public bool IndustrialTrainingRequired { get; set; }
    public bool RealLifeProjectRequired { get; set; }
    public bool ExternalAssessmentRequired { get; set; }
}
