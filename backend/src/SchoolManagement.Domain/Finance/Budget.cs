namespace SchoolManagement.Domain.Finance;

public sealed class Budget
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DepartmentId { get; init; }
    public Guid AcademicYearId { get; init; }
    public required string Name { get; init; }
    public decimal TotalAmount { get; init; }
    public string Currency { get; init; } = "UGX";
    public DateTimeOffset StartDate { get; init; }
    public DateTimeOffset EndDate { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public ICollection<BudgetLine> Lines { get; set; } = new List<BudgetLine>();
}
