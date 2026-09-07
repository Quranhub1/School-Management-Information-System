using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

public sealed class AssessmentService(SchoolManagement.Application.Abstractions.IAssessmentRepository assessments)
{
    public Task<IReadOnlyList<AssessmentPlan>> GetPlansAsync(Guid? courseId = null, CancellationToken cancellationToken = default) =>
        assessments.GetPlansAsync(courseId, cancellationToken);

    public Task<IReadOnlyList<StudentAssessment>> GetStudentAssessmentsAsync(Guid courseRegistrationId, CancellationToken cancellationToken = default) =>
        assessments.GetStudentAssessmentsAsync(courseRegistrationId, cancellationToken);

    public async Task<StudentAssessment> RecordAssessmentAsync(
        Guid studentId,
        Guid courseRegistrationId,
        Guid assessmentPlanId,
        decimal score,
        decimal maximumScore,
        string? competencyLevel,
        CancellationToken cancellationToken = default)
    {
        if (maximumScore <= 0m) throw new ArgumentOutOfRangeException(nameof(maximumScore), "Maximum score must be greater than zero.");
        if (score < 0m || score > maximumScore) throw new ArgumentOutOfRangeException(nameof(score), "Score must be between zero and the maximum score.");

        var plans = await assessments.GetPlansAsync(null, cancellationToken);
        var plan = plans.SingleOrDefault(x => x.Id == assessmentPlanId)
            ?? throw new InvalidOperationException("The selected assessment plan does not exist or is inactive.");

        if (plan.IsCompetencyBased && string.IsNullOrWhiteSpace(competencyLevel))
            throw new InvalidOperationException("A competency level is required for a competency-based assessment.");

        return await assessments.AddStudentAssessmentAsync(new StudentAssessment
        {
            StudentId = studentId,
            CourseRegistrationId = courseRegistrationId,
            AssessmentPlanId = assessmentPlanId,
            Score = score,
            MaximumScore = maximumScore,
            CompetencyLevel = string.IsNullOrWhiteSpace(competencyLevel) ? null : competencyLevel.Trim(),
            IsFinalized = false
        }, cancellationToken);
    }
}
