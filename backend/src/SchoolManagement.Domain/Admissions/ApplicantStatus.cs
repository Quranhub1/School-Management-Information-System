namespace SchoolManagement.Domain.Admissions;

/// <summary>
/// Strongly-typed applicant lifecycle status, replacing the previous magic-string
/// statuses ("Submitted", "Accepted", "Rejected", "Admitted").
/// </summary>
public enum ApplicantStatus
{
    Submitted = 0,
    Accepted = 1,
    Rejected = 2,
    Admitted = 3
}
