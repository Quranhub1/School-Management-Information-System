using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

public sealed class AssessmentWorkflowService(IAssessmentRepository assessments)
{
    public async Task<IReadOnlyList<StudentAssessment>> RecordBatchAsync(IEnumerable<RecordAssessmentCommand> commands, CancellationToken cancellationToken = default)
    {
        var results = new List<StudentAssessment>();
        foreach (var command in commands)
        {
            if (command.MaximumScore <= 0m || command.Score < 0m || command.Score > command.MaximumScore)
                throw new ArgumentOutOfRangeException(nameof(command), "Assessment score is outside the permitted range.");
            results.Add(await assessments.AddStudentAssessmentAsync(new StudentAssessment
            {
                StudentId = command.StudentId,
                CourseRegistrationId = command.CourseRegistrationId,
                AssessmentPlanId = command.AssessmentPlanId,
                Score = command.Score,
                MaximumScore = command.MaximumScore,
                CompetencyLevel = string.IsNullOrWhiteSpace(command.CompetencyLevel) ? null : command.CompetencyLevel.Trim(),
                IsFinalized = false
            }, cancellationToken));
        }
        return results;
    }
}

public sealed record RecordAssessmentCommand(Guid StudentId, Guid CourseRegistrationId, Guid AssessmentPlanId, decimal Score, decimal MaximumScore, string? CompetencyLevel);
