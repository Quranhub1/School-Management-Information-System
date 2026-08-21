namespace SchoolManagement.Domain.Assessment;

public static class AcademicStandingCalculator
{
    public static AcademicStanding Determine(
        Guid studentId,
        decimal gpa,
        decimal cgpa,
        decimal warningThreshold = 2.0m,
        decimal probationThreshold = 1.5m)
    {
        if (studentId == Guid.Empty)
            throw new ArgumentException("Student ID is required.", nameof(studentId));
        if (gpa < 0m || cgpa < 0m)
            throw new ArgumentOutOfRangeException(nameof(gpa), "GPA and CGPA cannot be negative.");
        if (warningThreshold < probationThreshold)
            throw new ArgumentException("Warning threshold must be greater than or equal to probation threshold.");

        var status = cgpa < probationThreshold
            ? AcademicStandingStatus.Discontinued
            : cgpa < warningThreshold
                ? AcademicStandingStatus.Probation
                : gpa < warningThreshold
                    ? AcademicStandingStatus.AcademicWarning
                    : AcademicStandingStatus.GoodStanding;

        return new AcademicStanding
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            Gpa = decimal.Round(gpa, 2),
            Cgpa = decimal.Round(cgpa, 2),
            Status = status,
            EligibleToProgress = status is AcademicStandingStatus.GoodStanding or AcademicStandingStatus.AcademicWarning,
            DeterminedAt = DateTime.UtcNow
        };
    }
}
