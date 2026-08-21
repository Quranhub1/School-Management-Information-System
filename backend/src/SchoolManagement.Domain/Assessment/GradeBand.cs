namespace SchoolManagement.Domain.Assessment;

public sealed class GradeBand
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid GradingScaleId { get; init; }
    public string Grade { get; set; } = string.Empty;
    public decimal MinimumScore { get; set; }
    public decimal MaximumScore { get; set; }
    public decimal GradePoint { get; set; }
    public bool IsPass { get; set; }
}
