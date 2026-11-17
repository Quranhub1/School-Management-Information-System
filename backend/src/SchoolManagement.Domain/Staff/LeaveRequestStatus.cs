namespace SchoolManagement.Domain.Staff;

/// <summary>
/// Strongly-typed leave request status, replacing the previous magic-string
/// statuses ("Pending", "Approved", "Rejected").
/// </summary>
public enum LeaveRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Cancelled = 3
}
