namespace SchoolManagement.Domain.Assessment;

public sealed class ProgrammeAssessmentProfile
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; init; }
    public AssessmentAuthority Authority { get; init; }
    public ProgrammeFamily Family { get; init; }
    public AssessmentModel Model { get; init; }

    public bool ContinuousAssessmentEnabled { get; init; }
    public bool TheoryAssessmentEnabled { get; init; }
    public bool PracticalAssessmentEnabled { get; init; }
    public bool IndustrialTrainingEnabled { get; init; }
    public bool RealLifeProjectEnabled { get; init; }
    public bool CompetencyAssessmentEnabled { get; init; }
    public bool ClinicalOrWorkBasedRecordEnabled { get; init; }
    public bool GpaEnabled { get; init; }
    public bool TranscriptEnabled { get; init; }
    public bool ExternalAssessmentEnabled { get; init; }
    public bool IsActive { get; set; } = true;
}
