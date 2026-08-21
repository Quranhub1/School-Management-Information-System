namespace SchoolManagement.Domain.Assessment;

/// <summary>
/// Produces a finalized course result from weighted student assessments and a configurable grading scale.
/// </summary>
public static class AssessmentResultCalculator
{
    public static AssessmentResult Calculate(
        IEnumerable<StudentAssessment> assessments,
        IEnumerable<AssessmentPlan> plans,
        GradingScale gradingScale,
        IEnumerable<GradeBand> gradeBands,
        Guid courseRegistrationId)
    {
        ArgumentNullException.ThrowIfNull(assessments);
        ArgumentNullException.ThrowIfNull(plans);
        ArgumentNullException.ThrowIfNull(gradingScale);
        ArgumentNullException.ThrowIfNull(gradeBands);

        var assessmentList = assessments.ToList();
        var planById = plans.ToDictionary(x => x.Id);
        if (assessmentList.Count == 0)
            throw new InvalidOperationException("At least one assessment is required.");

        var weighted = new List<(StudentAssessment Assessment, AssessmentPlan Plan, decimal Percentage)>();
        foreach (var assessment in assessmentList)
        {
            if (!planById.TryGetValue(assessment.AssessmentPlanId, out var plan))
                throw new ArgumentException($"Assessment plan {assessment.AssessmentPlanId} was not supplied.", nameof(plans));
            if (assessment.MaximumScore <= 0)
                throw new ArgumentException("Maximum score must be greater than zero.", nameof(assessments));
            if (plan.WeightPercentage < 0)
                throw new ArgumentException("Assessment weights cannot be negative.", nameof(plans));

            var percentage = assessment.Score / assessment.MaximumScore * 100m;
            weighted.Add((assessment, plan, percentage));
        }

        var weightTotal = weighted.Sum(x => x.Plan.WeightPercentage);
        if (weightTotal <= 0)
            throw new InvalidOperationException("Assessment weights must total more than zero.");

        var totalScore = weighted.Sum(x => x.Percentage * x.Plan.WeightPercentage) / weightTotal;
        var band = gradeBands
            .Where(x => x.GradingScaleId == gradingScale.Id)
            .OrderByDescending(x => x.MinimumScore)
            .FirstOrDefault(x => totalScore >= x.MinimumScore && totalScore <= x.MaximumScore);

        var studentId = assessmentList.Select(x => x.StudentId).Distinct().ToList();
        if (studentId.Count != 1)
            throw new InvalidOperationException("All assessments must belong to the same student.");

        return new AssessmentResult
        {
            Id = Guid.NewGuid(),
            StudentId = studentId[0],
            CourseRegistrationId = courseRegistrationId,
            TotalScore = decimal.Round(totalScore, 2, MidpointRounding.AwayFromZero),
            Grade = band?.Grade,
            GradePoint = band?.GradePoint ?? 0m,
            IsFinal = assessmentList.All(x => x.IsFinal),
            FinalizedAt = assessmentList.All(x => x.IsFinal) ? DateTimeOffset.UtcNow : null
        };
    }
}
