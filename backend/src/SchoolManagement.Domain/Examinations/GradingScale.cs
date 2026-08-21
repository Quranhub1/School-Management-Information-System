namespace SchoolManagement.Domain.Examinations;

/// <summary>
/// Institution-configurable grading scale. The actual bands are data, not hard-coded,
/// so a Ugandan institution can configure its approved academic regulations.
/// </summary>
public sealed class GradingScale
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<GradeBand> Bands { get; set; } = new List<GradeBand>();
}

public sealed class GradeBand
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid GradingScaleId { get; init; }
    public required string Grade { get; set; }
    public decimal MinimumScore { get; set; }
    public decimal MaximumScore { get; set; }
    public decimal GradePoint { get; set; }
    public bool IsPass { get; set; }
    public int DisplayOrder { get; set; }
}
