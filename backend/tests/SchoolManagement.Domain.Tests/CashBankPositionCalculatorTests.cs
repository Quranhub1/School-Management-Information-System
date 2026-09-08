using FluentAssertions;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class CashBankPositionCalculatorTests
{
    [Fact]
    public void Calculate_should_reconcile_opening_movement_and_closing_balance()
    {
        var accountId = Guid.NewGuid();
        var movements = new[]
        {
            new CashBankMovement(accountId, "1010", "Cash", "Asset", 500_000m, 0m),
            new CashBankMovement(accountId, "1010", "Cash", "Asset", 250_000m, 100_000m),
            new CashBankMovement(accountId, "1010", "Cash", "Asset", 0m, 75_000m)
        };

        var result = CashBankPositionCalculator.Calculate(
            accountId,
            "1010",
            "Cash",
            "Asset",
            1_000_000m,
            movements);

        result.Inflows.Should().Be(750_000m);
        result.Outflows.Should().Be(175_000m);
        result.NetMovement.Should().Be(575_000m);
        result.ClosingBalance.Should().Be(1_575_000m);
    }

    [Fact]
    public void Calculate_should_preserve_bank_reconciliation_metadata()
    {
        var accountId = Guid.NewGuid();
        var reconciledAt = new DateTimeOffset(2026, 9, 8, 10, 0, 0, TimeSpan.Zero);

        var result = CashBankPositionCalculator.Calculate(
            accountId,
            "1020",
            "Bank",
            "Asset",
            2_000_000m,
            Array.Empty<CashBankMovement>(),
            "Reconciled",
            reconciledAt,
            2_000_000m,
            0m);

        result.ReconciliationStatus.Should().Be("Reconciled");
        result.ReconciledAt.Should().Be(reconciledAt);
        result.StatementBalance.Should().Be(2_000_000m);
        result.ReconciliationDifference.Should().Be(0m);
        result.ClosingBalance.Should().Be(2_000_000m);
    }
}
