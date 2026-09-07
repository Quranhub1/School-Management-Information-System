namespace SchoolManagement.Domain.Assessment;

public static class ProgrammeAssessmentProfileRules
{
    public static IReadOnlyList<string> Validate(ProgrammeAssessmentProfile profile)
    {
        var errors = new List<string>();

        if (profile.Authority == AssessmentAuthority.UHPAB)
        {
            if (profile.Family != ProgrammeFamily.Health)
                errors.Add("UHPAB programmes must use the Health programme family.");
            if (profile.Model == AssessmentModel.CompetencyBased)
                errors.Add("UHPAB programmes cannot use the UVTAB competency-based assessment model.");
            if (profile.IndustrialTrainingEnabled)
                errors.Add("Industrial training is a UVTAB-specific component and cannot be enabled for UHPAB.");
            if (profile.RealLifeProjectEnabled)
                errors.Add("Real-life project assessment is a UVTAB-specific component and cannot be enabled for UHPAB.");
            if (profile.CompetencyAssessmentEnabled)
                errors.Add("Competency assessment is a UVTAB-specific component and cannot be enabled for UHPAB.");
        }

        if (profile.Authority == AssessmentAuthority.UVTAB)
        {
            if (profile.Model == AssessmentModel.Academic)
                errors.Add("UVTAB programmes cannot use an academic-only assessment model.");
            if (!profile.CompetencyAssessmentEnabled)
                errors.Add("UVTAB programmes must enable competency assessment.");
        }

        return errors;
    }

    public static bool IsValid(ProgrammeAssessmentProfile profile) => Validate(profile).Count == 0;
}
