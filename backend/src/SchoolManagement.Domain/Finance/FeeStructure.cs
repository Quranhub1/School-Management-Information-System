namespace SchoolManagement.Domain.Finance;

public sealed class FeeStructure
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProgrammeId { get; set; }
    public Guid AcademicYearId { get; set; }
    public required string Name { get; set; }
    public string FeeType { get; set; } = "Tuition";
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "UGX";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
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
