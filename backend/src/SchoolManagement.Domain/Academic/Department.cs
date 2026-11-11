namespace SchoolManagement.Domain.Academic;

public sealed class Department
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid FacultyId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public Guid? HeadStaffId { get; init; }
    public bool IsActive { get; set; } = true;
}
