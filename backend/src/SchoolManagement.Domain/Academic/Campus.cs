namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A physical or operational site belonging to an institution.
/// </summary>
public sealed class Campus
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InstitutionId { get; init; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Address { get; set; }
    public string? District { get; set; }
    public bool IsActive { get; set; } = true;
}
