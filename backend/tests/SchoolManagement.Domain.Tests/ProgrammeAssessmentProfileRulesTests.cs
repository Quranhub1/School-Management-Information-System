using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Domain.Tests;

public sealed class ProgrammeAssessmentProfileRulesTests
{
    [Fact]
    public void Uhpab_cannot_enable_uvtab_components()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UHPAB,
            Family = ProgrammeFamily.Health,
            Model = AssessmentModel.Academic,
            IndustrialTrainingEnabled = true,
            RealLifeProjectEnabled = true,
            CompetencyAssessmentEnabled = true
        };

        var errors = ProgrammeAssessmentProfileRules.Validate(profile);

        Assert.Equal(3, errors.Count);
    }

    [Fact]
    public void Uhpab_requires_health_family()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UHPAB,
            Family = ProgrammeFamily.Engineering,
            Model = AssessmentModel.Academic
        };

        Assert.Contains("Health programme family", ProgrammeAssessmentProfileRules.Validate(profile)[0]);
    }

    [Fact]
    public void Uvtab_requires_competency_assessment()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UVTAB,
            Family = ProgrammeFamily.Engineering,
            Model = AssessmentModel.CompetencyBased
        };

        Assert.Contains("must enable competency assessment", ProgrammeAssessmentProfileRules.Validate(profile));
    }

    [Fact]
    public void Food_science_and_nutrition_has_dedicated_family()
    {
        var entry = SchoolManagement.Domain.Academic.ProgrammeCatalog.Uvtab
            .Single(x => x.Code == "UVTAB-FSN-C");

        Assert.Equal("FoodScienceAndNutrition", entry.Family);
        Assert.Equal("UVTAB", entry.Authority);
    }
}
