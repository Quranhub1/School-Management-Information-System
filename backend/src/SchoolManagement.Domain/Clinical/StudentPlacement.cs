namespace SchoolManagement.Domain.Clinical;

public sealed class StudentPlacement
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid PlacementId { get; init; }
    public Guid StudentId { get; init; }
    public required string Status { get; set; }
    public decimal? AssessmentScore { get; set; }
    public string? CompetencyOutcome { get; set; }
    public string? Remarks { get; set; }
}
