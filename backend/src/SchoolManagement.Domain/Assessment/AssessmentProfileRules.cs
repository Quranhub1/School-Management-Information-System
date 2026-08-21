namespace SchoolManagement.Domain.Assessment;

public static class AssessmentProfileRules
{
    public static ProgrammeAssessmentProfile CreateInstitutionalAcademic(
        Guid programmeId,
        ProgrammeFamily family = ProgrammeFamily.Other) =>
        new()
        {
            ProgrammeId = programmeId,
            Authority = AssessmentAuthority.Institutional,
            Family = family,
            Model = AssessmentModel.Academic,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = false,
            IndustrialTrainingEnabled = false,
            RealLifeProjectEnabled = false,
            CompetencyAssessmentEnabled = false,
            ClinicalOrWorkBasedRecordEnabled = false,
            GpaEnabled = true,
            TranscriptEnabled = true,
            ExternalAssessmentEnabled = false
        };

    public static ProgrammeAssessmentProfile CreateInstitutionalHybrid(
        Guid programmeId,
        ProgrammeFamily family = ProgrammeFamily.Other) =>
        new()
        {
            ProgrammeId = programmeId,
            Authority = AssessmentAuthority.Institutional,
            Family = family,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            IndustrialTrainingEnabled = false,
            RealLifeProjectEnabled = true,
            CompetencyAssessmentEnabled = true,
            ClinicalOrWorkBasedRecordEnabled = true,
            GpaEnabled = true,
            TranscriptEnabled = true,
            ExternalAssessmentEnabled = false
        };

    public static ProgrammeAssessmentProfile CreateUhpab(
        Guid programmeId,
        ProgrammeFamily family = ProgrammeFamily.Health) =>
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

    public static ProgrammeAssessmentProfile CreateUvtab(
        Guid programmeId,
        ProgrammeFamily family) =>
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
        ArgumentNullException.ThrowIfNull(profile);

        if (profile.ProgrammeId == Guid.Empty)
            throw new ArgumentException("A valid programme ID is required.", nameof(profile));

        if (profile.Authority == AssessmentAuthority.UHPAB && profile.Family != ProgrammeFamily.Health)
            throw new ArgumentException("UHPAB programmes must use the Health programme family.");

        if (profile.Authority == AssessmentAuthority.UHPAB &&
            (profile.IndustrialTrainingEnabled || profile.RealLifeProjectEnabled || profile.CompetencyAssessmentEnabled))
            throw new ArgumentException("UHPAB profiles cannot enable UVTAB-specific competency, industrial-training or real-life-project components.");

        if (profile.Authority == AssessmentAuthority.UVTAB && profile.Model == AssessmentModel.Academic)
            throw new ArgumentException("UVTAB profiles cannot use the Academic-only assessment model.");

        if (profile.Model == AssessmentModel.Academic &&
            (profile.PracticalAssessmentEnabled || profile.IndustrialTrainingEnabled ||
             profile.RealLifeProjectEnabled || profile.CompetencyAssessmentEnabled ||
             profile.ClinicalOrWorkBasedRecordEnabled))
            throw new ArgumentException("Academic-only profiles cannot enable practical, workplace, project or competency components.");

        if (profile.Model == AssessmentModel.CompetencyBased && !profile.CompetencyAssessmentEnabled)
            throw new ArgumentException("Competency-based profiles must enable competency assessment.");

        if (!profile.TranscriptEnabled)
            throw new ArgumentException("Every assessment profile must support transcript records.");

        var enabledComponents = new[]
        {
            profile.ContinuousAssessmentEnabled,
            profile.TheoryAssessmentEnabled,
            profile.PracticalAssessmentEnabled,
            profile.IndustrialTrainingEnabled,
            profile.RealLifeProjectEnabled,
            profile.CompetencyAssessmentEnabled,
            profile.ClinicalOrWorkBasedRecordEnabled,
            profile.ExternalAssessmentEnabled
        }.Count(enabled => enabled);

        if (enabledComponents == 0)
            throw new ArgumentException("An assessment profile must enable at least one assessment component.");
    }
}
