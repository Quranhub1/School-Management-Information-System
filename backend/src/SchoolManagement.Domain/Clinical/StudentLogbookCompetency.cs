namespace SchoolManagement.Domain.Clinical;

public sealed class StudentLogbookCompetency
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentLogbookId { get; set; }
    public Guid CompetencyRequirementId { get; set; }
    public Guid? StudentPlacementId { get; set; }
    public string Outcome { get; set; } = "Pending";
    public DateOnly? AssessedOn { get; set; }
    public string? AssessorName { get; set; }
    public string? AssessorRole { get; set; }
    public string? EvidenceReference { get; set; }
    public string? Remarks { get; set; }
}
