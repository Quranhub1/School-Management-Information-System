namespace SchoolManagement.Domain.Assessment;

public static class AssessmentProfileRules
{
    public static ProgrammeAssessmentProfile CreateUhpab(Guid programmeId, ProgrammeFamily family = ProgrammeFamily.Health) =>
        new()
        {
            ProgrammeId = programmeId,
            Authority = AssessmentAuthority.UHPAB,
            Family = family,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            IndustrialTrainingEnabled = false,
            RealLifeProjectEnabled = false,
            CompetencyAssessmentEnabled = false,
            ClinicalOrWorkBasedRecordEnabled = true,
            GpaEnabled = true,
            TranscriptEnabled = true,
            ExternalAssessmentEnabled = true
        };

    public static ProgrammeAssessmentProfile CreateUvtab(Guid programmeId, ProgrammeFamily family) =>
        new()
        {
            ProgrammeId = programmeId,
            Authority = AssessmentAuthority.UVTAB,
            Family = family,
            Model = AssessmentModel.CompetencyBased,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            IndustrialTrainingEnabled = true,
            RealLifeProjectEnabled = true,
            CompetencyAssessmentEnabled = true,
            ClinicalOrWorkBasedRecordEnabled = true,
            GpaEnabled = false,
            TranscriptEnabled = true,
            ExternalAssessmentEnabled = true
        };

    public static void Validate(ProgrammeAssessmentProfile profile)
    {
        if (profile.Authority == AssessmentAuthority.UHPAB && profile.Family != ProgrammeFamily.Health)
            throw new ArgumentException("UHPAB programmes must use the Health programme family.");

        if (profile.Authority == AssessmentAuthority.UHPAB &&
            (profile.IndustrialTrainingEnabled || profile.RealLifeProjectEnabled || profile.CompetencyAssessmentEnabled))
            throw new ArgumentException("UHPAB profiles cannot enable UVTAB-specific competency, industrial-training or real-life-project components.");

        if (profile.Authority == AssessmentAuthority.UVTAB && profile.Model == AssessmentModel.Academic)
            throw new ArgumentException("UVTAB profiles cannot use the Academic-only assessment model.");
    }
}
