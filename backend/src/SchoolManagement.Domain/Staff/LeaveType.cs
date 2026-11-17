namespace SchoolManagement.Domain.Staff;

/// <summary>
/// Strongly-typed leave type, replacing the previous free-form string values.
/// </summary>
public enum LeaveType
{
    Annual = 0,
    Sick = 1,
    Maternity = 2,
    Paternity = 3,
    Study = 4
}
