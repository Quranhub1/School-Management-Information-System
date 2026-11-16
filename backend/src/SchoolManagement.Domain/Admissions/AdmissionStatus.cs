namespace SchoolManagement.Domain.Admissions;

/// <summary>
/// Strongly-typed admission lifecycle status, replacing the previous magic-string
/// statuses ("Pending", "Accepted", "Rejected", "Admitted").
/// </summary>
public enum AdmissionStatus
{
    Pending = 0,
    Accepted = 1,
    Rejected = 2,
    Admitted = 3
}
