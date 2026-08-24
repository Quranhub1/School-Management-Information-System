using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

public sealed record AssessmentPlanDto(Guid Id, Guid CourseId, string Name, string AssessmentType, decimal WeightPercentage, bool IsCompetencyBased, bool IsActive)
{
    public static AssessmentPlanDto FromDomain(AssessmentPlan x) => new(x.Id, x.CourseId, x.Name, x.AssessmentType, x.WeightPercentage, x.IsCompetencyBased, x.IsActive);
}

public sealed record StudentAssessmentDto(Guid Id, Guid StudentId, Guid CourseRegistrationId, Guid AssessmentPlanId, decimal Score, decimal MaximumScore, string? Grade, string? CompetencyLevel, bool IsFinalized, DateTimeOffset RecordedAt)
{
    public static StudentAssessmentDto FromDomain(StudentAssessment x) => new(x.Id, x.StudentId, x.CourseRegistrationId, x.AssessmentPlanId, x.Score, x.MaximumScore, x.Grade, x.CompetencyLevel, x.IsFinalized, x.RecordedAt);
}
