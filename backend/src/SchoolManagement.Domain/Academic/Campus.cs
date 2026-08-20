namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A physical or operational site belonging to an institution.
/// </summary>
public sealed class Campus
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InstitutionId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Address { get; init; }
    public string? District { get; init; }
    public bool IsActive { get; set; } = true;
}
