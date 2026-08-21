namespace SchoolManagement.Domain.Assessment;

public enum AcademicStandingStatus
{
    GoodStanding = 1,
    AcademicWarning = 2,
    Probation = 3,
    Discontinued = 4
}

public sealed class AcademicStanding
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public decimal Gpa { get; set; }
    public decimal Cgpa { get; set; }
    public AcademicStandingStatus Status { get; set; }
    public bool EligibleToProgress { get; set; }
    public DateTime DeterminedAt { get; set; }
}
