namespace SchoolManagement.Domain.Clinical;

public sealed class LogbookCompetencyRequirement
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid LogbookRequirementId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int RequiredCount { get; set; } = 1;
    public bool IsMandatory { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
