using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

/// <summary>
/// Calculates a finalized course result from weighted assessment components
/// and an institution-configured grading scale.
/// </summary>
public sealed class AssessmentResultCalculator
{
    public AssessmentResult Calculate(
        Guid studentId,
        Guid courseRegistrationId,
        IReadOnlyCollection<StudentAssessment> assessments,
        IReadOnlyCollection<AssessmentPlan> plans,
        IReadOnlyCollection<GradeBand> gradeBands)
    {
        ArgumentNullException.ThrowIfNull(assessments);
        ArgumentNullException.ThrowIfNull(plans);
        ArgumentNullException.ThrowIfNull(gradeBands);

        if (assessments.Count == 0)
            throw new InvalidOperationException("At least one student assessment is required.");

        var planById = plans.ToDictionary(x => x.Id);
        decimal totalScore = 0m;
        decimal totalWeight = 0m;

        foreach (var assessment in assessments)
        {
            if (assessment.CourseRegistrationId != courseRegistrationId)
                throw new InvalidOperationException("Assessment belongs to a different course registration.");

            if (!planById.TryGetValue(assessment.AssessmentPlanId, out var plan))
                throw new InvalidOperationException($"Assessment plan '{assessment.AssessmentPlanId}' was not supplied.");

            if (assessment.MaximumScore <= 0m)
                throw new InvalidOperationException("Maximum assessment score must be greater than zero.");

            if (assessment.Score < 0m || assessment.Score > assessment.MaximumScore)
                throw new InvalidOperationException("Assessment score is outside its valid range.");

            if (plan.WeightPercentage < 0m || plan.WeightPercentage > 100m)
                throw new InvalidOperationException("Assessment weight must be between 0 and 100 percent.");

            var percentage = assessment.Score / assessment.MaximumScore * 100m;
            totalScore += percentage * plan.WeightPercentage / 100m;
            totalWeight += plan.WeightPercentage;
        }

        if (totalWeight <= 0m)
            throw new InvalidOperationException("Assessment plans must have a positive total weight.");

        if (totalWeight > 100m)
            throw new InvalidOperationException("Assessment plan weights cannot exceed 100 percent.");

        if (totalWeight != 100m)
            throw new InvalidOperationException("Assessment plan weights must total exactly 100 percent before a course result can be finalized.");

        var gradeBand = gradeBands
            .Where(x => totalScore >= x.MinimumScore && totalScore <= x.MaximumScore)
            .OrderBy(x => x.MinimumScore)
            .FirstOrDefault()
            ?? throw new InvalidOperationException($"No grading band covers the calculated score {totalScore:0.##}.");

        return new AssessmentResult
        {
            StudentId = studentId,
            CourseRegistrationId = courseRegistrationId,
            TotalScore = decimal.Round(totalScore, 2, MidpointRounding.AwayFromZero),
            Grade = gradeBand.Grade,
            GradePoint = gradeBand.GradePoint,
            IsFinal = true,
            FinalizedAt = DateTimeOffset.UtcNow
        };
    }
}
