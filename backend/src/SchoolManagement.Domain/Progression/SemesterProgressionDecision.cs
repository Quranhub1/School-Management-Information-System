namespace SchoolManagement.Domain.Progression;

public enum ProgressionOutcome
{
    Promoted,
    Conditional,
    Repeat
}

public sealed class SemesterProgressionDecision
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid StudentId { get; private set; }
    public Guid FromSemesterId { get; private set; }
    public Guid? ToSemesterId { get; private set; }
    public ProgressionOutcome Outcome { get; private set; }
    public decimal PassRate { get; private set; }
    public string? Reason { get; private set; }
    public DateTime DecidedAtUtc { get; private set; } = DateTime.UtcNow;

    private SemesterProgressionDecision() { }

    public SemesterProgressionDecision(Guid studentId, Guid fromSemesterId, Guid? toSemesterId,
        ProgressionOutcome outcome, decimal passRate, string? reason = null)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student is required.", nameof(studentId));
        if (fromSemesterId == Guid.Empty) throw new ArgumentException("Source semester is required.", nameof(fromSemesterId));
        if (passRate is < 0 or > 100) throw new ArgumentOutOfRangeException(nameof(passRate));
        if (outcome == ProgressionOutcome.Promoted && toSemesterId is null)
            throw new ArgumentException("A promoted student must have a target semester.", nameof(toSemesterId));

        StudentId = studentId;
        FromSemesterId = fromSemesterId;
        ToSemesterId = toSemesterId;
        Outcome = outcome;
        PassRate = passRate;
        Reason = reason;
    }
}