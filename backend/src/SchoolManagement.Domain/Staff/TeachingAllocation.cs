namespace SchoolManagement.Domain.Staff;

public sealed class TeachingAllocation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StaffMemberId { get; init; }
    public Guid CourseId { get; init; }
    public Guid SemesterId { get; init; }
    public required string Role { get; init; }
    public bool IsActive { get; set; } = true;
}
