namespace SchoolManagement.Domain.Academic;

public sealed class Faculty
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InstitutionId { get; init; }
    public Guid? CampusId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public Guid? HeadStaffId { get; init; }
    public bool IsActive { get; set; } = true;
}
