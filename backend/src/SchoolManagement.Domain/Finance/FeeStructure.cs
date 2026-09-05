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
        foreach (var item in Items)
        {
            if (item.Amount < 0)
                throw new InvalidOperationException($"Fee item '{item.Code}' cannot have a negative amount.");
            if (!string.Equals(item.Currency, Currency, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Fee item '{item.Code}' currency must match the fee structure currency.");
        }

        TotalAmount = Items.Where(x => !x.IsOptional).Sum(x => x.Amount);
    }
}
