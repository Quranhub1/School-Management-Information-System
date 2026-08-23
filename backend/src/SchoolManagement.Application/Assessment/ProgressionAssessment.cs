using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

/// <summary>
/// Evaluates progression inputs without treating missed papers as numeric failures.
/// Regulatory/program-specific progression rules remain configurable above this layer.
/// </summary>
public sealed class ProgressionAssessment
{
    public ProgressionDecision Evaluate(
        AcademicResultSummary summary,
        IReadOnlyCollection<TranscriptEntry> transcript)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(transcript);

        var missed = transcript
            .Where(x => x.StudentId == summary.StudentId && x.Status == TranscriptStatus.Missed)
            .ToList();

        if (missed.Count > 0)
        {
            return new ProgressionDecision
            {
                StudentId = summary.StudentId,
                IsEligibleByGpa = summary.Gpa > 0m,
                HasOutstandingPapers = true,
                OutstandingPaperCount = missed.Count,
                Decision = "REVIEW_REQUIRED",
                Reason = "Student has outstanding missed paper(s) recorded as X. Apply the configured UHPAB/UVTAB progression rule before promotion."
            };
        }

        return new ProgressionDecision
        {
            StudentId = summary.StudentId,
            IsEligibleByGpa = summary.Gpa > 0m,
            HasOutstandingPapers = false,
            OutstandingPaperCount = 0,
            Decision = summary.Gpa > 0m ? "ELIGIBLE" : "REVIEW_REQUIRED",
            Reason = summary.Gpa > 0m ? "No outstanding missed papers." : "Academic result requires review."
        };
    }
}

public sealed class ProgressionDecision
{
    public Guid StudentId { get; init; }
    public bool IsEligibleByGpa { get; init; }
    public bool HasOutstandingPapers { get; init; }
    public int OutstandingPaperCount { get; init; }
    public string Decision { get; init; } = "REVIEW_REQUIRED";
    public string Reason { get; init; } = string.Empty;
}
