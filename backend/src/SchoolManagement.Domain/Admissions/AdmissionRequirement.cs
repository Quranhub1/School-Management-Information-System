namespace SchoolManagement.Domain.Admissions;

public sealed class AdmissionRequirement
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; init; }
    public required string RequirementType { get; init; }
    public required string Description { get; init; }
    public bool IsMandatory { get; set; } = true;
    public int DisplayOrder { get; init; }
    public bool IsActive { get; set; } = true;
}
