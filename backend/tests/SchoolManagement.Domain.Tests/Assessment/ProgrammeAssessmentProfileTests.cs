using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Domain.Tests.Assessment;

public sealed class ProgrammeAssessmentProfileTests
{
    [Fact]
    public void UhpabProfile_SupportsHealthProgrammeAssessmentComponents()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UHPAB,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            ExternalAssessmentEnabled = true
        };

        Assert.Equal(AssessmentAuthority.UHPAB, profile.Authority);
        Assert.Equal(AssessmentModel.Hybrid, profile.Model);
        Assert.True(profile.ContinuousAssessmentEnabled);
        Assert.True(profile.TheoryAssessmentEnabled);
        Assert.True(profile.PracticalAssessmentEnabled);
        Assert.True(profile.ExternalAssessmentEnabled);
    }

    [Fact]
    public void UvtabProfile_SupportsCompetencyBasedTrainingAndAssessment()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UVTAB,
            Model = AssessmentModel.CompetencyBased,
            ContinuousAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            IndustrialTrainingEnabled = true,
            RealLifeProjectEnabled = true,
            ExternalAssessmentEnabled = true
        };

        Assert.Equal(AssessmentAuthority.UVTAB, profile.Authority);
        Assert.Equal(AssessmentModel.CompetencyBased, profile.Model);
        Assert.True(profile.IndustrialTrainingEnabled);
        Assert.True(profile.RealLifeProjectEnabled);
        Assert.True(profile.PracticalAssessmentEnabled);
    }

    [Fact]
    public void InstitutionalProfile_CanUseAcademicModelWithoutExternalAuthority()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Institutional,
            Model = AssessmentModel.Academic,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true
        };

        Assert.Equal(AssessmentAuthority.Institutional, profile.Authority);
        Assert.Equal(AssessmentModel.Academic, profile.Model);
        Assert.True(profile.ContinuousAssessmentEnabled);
        Assert.True(profile.TheoryAssessmentEnabled);
        Assert.False(profile.IndustrialTrainingEnabled);
    }

    [Fact]
    public void HybridProfile_CanCombineAcademicAndCompetencyComponents()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.UHPAB,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentEnabled = true,
            TheoryAssessmentEnabled = true,
            PracticalAssessmentEnabled = true,
            IndustrialTrainingEnabled = true
        };

        Assert.Equal(AssessmentModel.Hybrid, profile.Model);
        Assert.True(profile.TheoryAssessmentEnabled);
        Assert.True(profile.PracticalAssessmentEnabled);
        Assert.True(profile.IndustrialTrainingEnabled);
    }
}
