namespace SchoolManagement.Domain.Academic;

public sealed class Faculty
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InstitutionId { get; init; }
    public Guid? CampusId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid? HeadStaffId { get; init; }
    public bool IsActive { get; set; } = true;
}
