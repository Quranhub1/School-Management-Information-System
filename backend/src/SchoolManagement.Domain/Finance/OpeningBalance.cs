namespace SchoolManagement.Domain.Finance;

public sealed class OpeningBalance
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid FiscalPeriodId { get; init; }
    public Guid AccountId { get; init; }
    public decimal Debit { get; init; }
    public decimal Credit { get; init; }
    public string Currency { get; init; } = "UGX";
    public string? SourceReference { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public void Validate()
    {
        if (Debit < 0 || Credit < 0) throw new InvalidOperationException("Opening balance amounts cannot be negative.");
        if (Debit > 0 && Credit > 0) throw new InvalidOperationException("An opening balance cannot contain both debit and credit.");
        if (Debit == 0 && Credit == 0) throw new InvalidOperationException("An opening balance must contain a debit or credit amount.");
    }
}
