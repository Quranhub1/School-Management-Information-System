using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class AssessmentProfileRulesTests
{
    [Fact]
    public void Institutional_academic_profile_uses_gpa_and_transcript()
    {
        var profile = AssessmentProfileRules.CreateInstitutionalAcademic(Guid.NewGuid(), ProgrammeFamily.Business);

        Assert.Equal(AssessmentAuthority.Institutional, profile.Authority);
        Assert.Equal(AssessmentModel.Academic, profile.Model);
        Assert.True(profile.ContinuousAssessmentEnabled);
        Assert.True(profile.TheoryAssessmentEnabled);
        Assert.False(profile.PracticalAssessmentEnabled);
        Assert.True(profile.GpaEnabled);
        Assert.True(profile.TranscriptEnabled);
        AssessmentProfileRules.Validate(profile);
    }

    [Fact]
    public void Institutional_hybrid_profile_supports_mixed_assessment()
    {
        var profile = AssessmentProfileRules.CreateInstitutionalHybrid(Guid.NewGuid(), ProgrammeFamily.ICT);

        Assert.Equal(AssessmentAuthority.Institutional, profile.Authority);
        Assert.Equal(AssessmentModel.Hybrid, profile.Model);
        Assert.True(profile.PracticalAssessmentEnabled);
        Assert.True(profile.CompetencyAssessmentEnabled);
        Assert.True(profile.RealLifeProjectEnabled);
        Assert.True(profile.GpaEnabled);
        Assert.True(profile.TranscriptEnabled);
        AssessmentProfileRules.Validate(profile);
    }

    [Fact]
    public void Uhpab_profile_is_health_only_and_has_no_uvtab_components()
    {
        var profile = AssessmentProfileRules.CreateUhpab(Guid.NewGuid());

        Assert.Equal(AssessmentAuthority.UHPAB, profile.Authority);
        Assert.Equal(ProgrammeFamily.Health, profile.Family);
        Assert.False(profile.IndustrialTrainingEnabled);
        Assert.False(profile.RealLifeProjectEnabled);
        Assert.False(profile.CompetencyAssessmentEnabled);
        Assert.True(profile.GpaEnabled);
        Assert.True(profile.TranscriptEnabled);
        AssessmentProfileRules.Validate(profile);
    }

    [Fact]
    public void Uvtab_profile_enables_competency_and_work_based_components()
    {
        var profile = AssessmentProfileRules.CreateUvtab(Guid.NewGuid(), ProgrammeFamily.Engineering);

        Assert.Equal(AssessmentAuthority.UVTAB, profile.Authority);
        Assert.Equal(AssessmentModel.CompetencyBased, profile.Model);
        Assert.True(profile.IndustrialTrainingEnabled);
        Assert.True(profile.RealLifeProjectEnabled);
        Assert.True(profile.CompetencyAssessmentEnabled);
        Assert.False(profile.GpaEnabled);
        Assert.True(profile.TranscriptEnabled);
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
        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UHPAB,
            Family = ProgrammeFamily.Health,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            IndustrialTrainingEnabled = true,
            TranscriptEnabled = true
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
            Model = AssessmentModel.Academic,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            TranscriptEnabled = true
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }

    [Fact]
    public void Academic_model_rejects_competency_components()
    {
        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Institutional,
            Family = ProgrammeFamily.Business,
            Model = AssessmentModel.Academic,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            CompetencyAssessmentEnabled = true,
            TranscriptEnabled = true
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }

    [Fact]
    public void Competency_model_requires_competency_assessment()
    {
        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Institutional,
            Family = ProgrammeFamily.Technology,
            Model = AssessmentModel.CompetencyBased,
            PracticalAssessmentEnabled = true,
            TranscriptEnabled = true
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }

    [Fact]
    public void Every_profile_requires_transcript_support()
    {
        var invalid = new ProgrammeAssessmentProfile
        {
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Institutional,
            Family = ProgrammeFamily.Other,
            Model = AssessmentModel.Academic,
            TheoryAssessmentEnabled = true
        };

        Assert.Throws<ArgumentException>(() => AssessmentProfileRules.Validate(invalid));
    }
}
