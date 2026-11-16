namespace SchoolManagement.Domain.Academic;

public sealed class UhpabFeeReference
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Category { get; set; } = string.Empty;
    public string? ProgrammeCode { get; set; }
    public string? ProgrammeName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "UGX";
    public string SourceUrl { get; set; } = "https://uhpab.go.ug/assessment-fees";
    public string SourceTitle { get; set; } = "UHPAB assessment fees";
    public DateOnly SourceCheckedOn { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
}
