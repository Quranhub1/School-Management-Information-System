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
            Authority = AssessmentAuthority.Uhpab,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentRequired = true,
            TheoryAssessmentRequired = true,
            PracticalAssessmentRequired = true,
            ExternalAssessmentRequired = true
        };

        Assert.Equal(AssessmentAuthority.Uhpab, profile.Authority);
        Assert.Equal(AssessmentModel.Hybrid, profile.Model);
        Assert.True(profile.ContinuousAssessmentRequired);
        Assert.True(profile.TheoryAssessmentRequired);
        Assert.True(profile.PracticalAssessmentRequired);
        Assert.True(profile.ExternalAssessmentRequired);
    }

    [Fact]
    public void UvtabProfile_SupportsCompetencyBasedTrainingAndAssessment()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Uvtab,
            Model = AssessmentModel.CompetencyBased,
            ContinuousAssessmentRequired = true,
            PracticalAssessmentRequired = true,
            IndustrialTrainingRequired = true,
            RealLifeProjectRequired = true,
            ExternalAssessmentRequired = true
        };

        Assert.Equal(AssessmentAuthority.Uvtab, profile.Authority);
        Assert.Equal(AssessmentModel.CompetencyBased, profile.Model);
        Assert.True(profile.IndustrialTrainingRequired);
        Assert.True(profile.RealLifeProjectRequired);
        Assert.True(profile.PracticalAssessmentRequired);
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
            ContinuousAssessmentRequired = true,
            TheoryAssessmentRequired = true
        };

        Assert.Equal(AssessmentAuthority.Institutional, profile.Authority);
        Assert.Equal(AssessmentModel.Academic, profile.Model);
        Assert.True(profile.ContinuousAssessmentRequired);
        Assert.True(profile.TheoryAssessmentRequired);
        Assert.False(profile.IndustrialTrainingRequired);
    }

    [Fact]
    public void HybridProfile_CanCombineAcademicAndCompetencyComponents()
    {
        var profile = new ProgrammeAssessmentProfile
        {
            Id = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            Authority = AssessmentAuthority.Uhpab,
            Model = AssessmentModel.Hybrid,
            ContinuousAssessmentRequired = true,
            TheoryAssessmentRequired = true,
            PracticalAssessmentRequired = true,
            IndustrialTrainingRequired = true
        };

        Assert.Equal(AssessmentModel.Hybrid, profile.Model);
        Assert.True(profile.TheoryAssessmentRequired);
        Assert.True(profile.PracticalAssessmentRequired);
        Assert.True(profile.IndustrialTrainingRequired);
    }
}
