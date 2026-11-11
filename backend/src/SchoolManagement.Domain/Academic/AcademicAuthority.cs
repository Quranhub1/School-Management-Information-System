namespace SchoolManagement.Domain.Academic;

public sealed class AcademicAuthority
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? SourceReference { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
