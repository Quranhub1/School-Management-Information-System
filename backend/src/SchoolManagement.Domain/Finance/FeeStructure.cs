namespace SchoolManagement.Domain.Finance;

public sealed class FeeStructure
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; init; }
    public Guid AcademicYearId { get; init; }
    public required string Name { get; init; }
    public decimal TotalAmount { get; private set; }
    public string Currency { get; init; } = "UGX";
    public bool IsActive { get; set; } = true;
    public ICollection<FeeStructureItem> Items { get; set; } = new List<FeeStructureItem>();

    public void RecalculateTotal()
    {
        TotalAmount = Items.Where(x => !x.IsOptional).Sum(x => x.Amount);
    }
}
