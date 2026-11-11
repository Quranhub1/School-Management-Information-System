using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Academic;

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

        Assert.Contains(
            ProgrammeAssessmentProfileRules.Validate(profile),
            error => error.Contains("must enable competency assessment", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Programme_stores_authority_source_and_reference_only_classification()
    {
        var programme = new Programme
        {
            Code = "UVTAB-FSN-C",
            Name = "Food Science and Nutrition",
            Award = "Certificate",
            Regulator = "UVTAB",
            ApprovalStatus = "ReferenceOnly",
            SourceReference = "SMIS programme import",
            IsReferenceOnly = true
        };

        Assert.Equal("UVTAB", programme.Regulator);
        Assert.Equal("ReferenceOnly", programme.ApprovalStatus);
        Assert.True(programme.IsReferenceOnly);
    }
}
