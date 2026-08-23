namespace SchoolManagement.Domain.Assessment;

/// <summary>
/// Academic transcript outcome code. X is the institutional code for a missed paper.
/// </summary>
public enum TranscriptStatus
{
    Recorded = 0,
    Missed = 1,
    Resit = 2
}
