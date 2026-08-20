namespace SchoolManagement.Domain.Academic;

/// <summary>
/// The top-level institutional identity. Academic and operational records belong
/// to an institution rather than being hard-coded to one school.
/// </summary>
public sealed class Institution
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string InstitutionType { get; init; }
    public string? RegistrationNumber { get; init; }
    public string? Regulator { get; init; }
    public string? Address { get; init; }
    public string? District { get; init; }
    public string? Region { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? Website { get; init; }
    public bool IsActive { get; set; } = true;
}
