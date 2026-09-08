using FluentAssertions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class FinanceProductionHardeningTests
{
    [Fact]
    public void OpeningBalance_rejects_two_sided_amount()
    {
        var balance = new OpeningBalance { FiscalPeriodId = Guid.NewGuid(), AccountId = Guid.NewGuid(), Debit = 10m, Credit = 1m };
        var act = () => balance.Validate();
        act.Should().Throw<InvalidOperationException>().WithMessage("An opening balance cannot contain both debit and credit.");
    }

    [Fact]
    public void BankTransaction_reconciliation_is_one_way()
    {
        var transaction = new BankTransaction { BankAccountId = Guid.NewGuid(), TransactionDate = DateTime.UtcNow, Reference = "BANK-001", Amount = 125_000m };
        var statementLine = Guid.NewGuid();
        transaction.Reconcile(statementLine);
        transaction.IsReconciled.Should().BeTrue();
        transaction.BankStatementLineId.Should().Be(statementLine);
        var act = () => transaction.Reconcile(Guid.NewGuid());
        act.Should().Throw<InvalidOperationException>().WithMessage("Bank transaction is already reconciled.");
    }

    [Fact]
    public void AdjustmentCancellation_marks_charge_void_and_records_reason()
    {
        var charge = new StudentCharge
        {
            StudentId = Guid.NewGuid(),
            Amount = 125_000m,
            Currency = "UGX",
            Description = "Test charge",
            Status = "Posted"
        };
        var service = new AdjustmentCancellationService();
        var audit = service.CancelStudentCharge(charge, "admin", "Duplicate charge");
        charge.Status.Should().Be("Voided");
        charge.VoidedBy.Should().Be("admin");
        charge.VoidReason.Should().Be("Duplicate charge");
        audit.Action.Should().Be("AdjustmentCancelled");
        audit.PerformedBy.Should().Be("admin");
        audit.Reason.Should().Be("Duplicate charge");
    }
}
