using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class AssessmentProfileRulesTests
{
    [Fact]
    public void Uhpab_profile_is_health_only_and_has_no_uvtab_components()
    {
        var profile = AssessmentProfileRules.CreateUhpab(Guid.NewGuid());

        Assert.Equal(AssessmentAuthority.UHPAB, profile.Authority);
        Assert.Equal(ProgrammeFamily.Health, profile.Family);
        Assert.False(profile.IndustrialTrainingEnabled);
        Assert.False(profile.RealLifeProjectEnabled);
        Assert.False(profile.CompetencyAssessmentEnabled);
        AssessmentProfileRules.Validate(profile);
    }

    [Fact]
    public void Uvtab_profile_enables_competency_and_work_based_components()
    {
        var profile = AssessmentProfileRules.CreateUvtab(Guid.NewGuid(), ProgrammeFamily.Engineering);

        Assert.Equal(AssessmentAuthority.UVTAB, profile.Authority);
        Assert.True(profile.IndustrialTrainingEnabled);
        Assert.True(profile.RealLifeProjectEnabled);
        Assert.True(profile.CompetencyAssessmentEnabled);
        Assert.False(profile.GpaEnabled);
        AssessmentProfileRules.Validate(profile);
    }

    [Fact]
    public void Uhpab_rejects_non_health_family()
    {
        var profile = AssessmentProfileRules.CreateUhpab(Guid.NewGuid(), ProgrammeFamily.Engineering);

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(profile));
    }

    [Fact]
    public void Uhpab_rejects_uvtab_specific_components()
    {
        var profile = AssessmentProfileRules.CreateUhpab(Guid.NewGuid());
        profile.GetType();

        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = profile.ProgrammeId,
            Authority = AssessmentAuthority.UHPAB,
            Family = ProgrammeFamily.Health,
            Model = AssessmentModel.Hybrid,
            IndustrialTrainingEnabled = true
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }

    [Fact]
    public void Uvtab_rejects_academic_only_model()
    {
        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UVTAB,
            Family = ProgrammeFamily.Technology,
            Model = AssessmentModel.Academic
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }
}
