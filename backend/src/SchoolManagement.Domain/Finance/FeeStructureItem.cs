namespace SchoolManagement.Domain.Finance;

/// <summary>
/// A single charge within a reusable fee structure (tuition, functional fees,
/// accommodation, examination, registration, etc.).
/// </summary>
public sealed class FeeStructureItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid FeeStructureId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public Guid? IncomeAccountId { get; init; }
    public int SortOrder { get; init; }
    public bool IsOptional { get; init; }
}
