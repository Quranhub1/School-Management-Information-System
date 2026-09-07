using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Academic;

public static class ProgrammeManagementRules
{
    public static ProgrammeAssessmentProfile CreateAssessmentProfile(
        Guid programmeId,
        AssessmentAuthority authority,
        ProgrammeFamily family,
        AssessmentModel model,
        bool continuousAssessmentEnabled,
        bool theoryAssessmentEnabled,
        bool practicalAssessmentEnabled,
        bool industrialTrainingEnabled,
        bool realLifeProjectEnabled,
        bool competencyAssessmentEnabled,
        bool clinicalOrWorkBasedRecordEnabled,
        bool gpaEnabled,
        bool transcriptEnabled,
        bool externalAssessmentEnabled)
    {
        var profile = new ProgrammeAssessmentProfile
        {
            ProgrammeId = programmeId,
            Authority = authority,
            Family = family,
            Model = model,
            ContinuousAssessmentEnabled = continuousAssessmentEnabled,
            TheoryAssessmentEnabled = theoryAssessmentEnabled,
            PracticalAssessmentEnabled = practicalAssessmentEnabled,
            IndustrialTrainingEnabled = industrialTrainingEnabled,
            RealLifeProjectEnabled = realLifeProjectEnabled,
            CompetencyAssessmentEnabled = competencyAssessmentEnabled,
            ClinicalOrWorkBasedRecordEnabled = clinicalOrWorkBasedRecordEnabled,
            GpaEnabled = gpaEnabled,
            TranscriptEnabled = transcriptEnabled,
            ExternalAssessmentEnabled = externalAssessmentEnabled
        };

        var errors = ProgrammeAssessmentProfileRules.Validate(profile);
        if (errors.Count > 0)
            throw new ArgumentException(string.Join(" ", errors));

        return profile;
    }

    public static ProgrammeCatalogEntry? FindCatalogEntry(string code, AssessmentAuthority authority)
    {
        var authorityName = authority.ToString();
        return ProgrammeCatalog.All.FirstOrDefault(x =>
            string.Equals(x.Code, code, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(x.Authority, authorityName, StringComparison.OrdinalIgnoreCase));
    }
}
