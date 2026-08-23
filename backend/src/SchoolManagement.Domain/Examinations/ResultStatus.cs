namespace SchoolManagement.Domain.Examinations;

/// <summary>
/// Outcome status recorded alongside an examination result.
/// X means the student missed the paper and must not be interpreted as a zero score.
/// </summary>
public enum ResultStatus
{
    Recorded = 0,
    Missed = 1,
    Resit = 2
}
