using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests;

public sealed class FiscalYearCarryForwardTests
{
    [Fact]
    public void BuildOpeningBalanceLines_carries_balance_sheet_balances_and_excludes_profit_and_loss()
    {
        var cash = new Account { Code = "1000", Name = "Cash", AccountType = "Asset" };
        var payable = new Account { Code = "2000", Name = "Payables", AccountType = "Liability" };
        var revenue = new Account { Code = "4000", Name = "Tuition Income", AccountType = "Revenue" };
        var campusId = Guid.NewGuid();

        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "J1",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = cash.Id, Account = cash, Debit = 150_000m, CampusId = campusId },
                    new() { AccountId = payable.Id, Account = payable, Credit = 50_000m, CampusId = campusId },
                    new() { AccountId = revenue.Id, Account = revenue, Credit = 100_000m, CampusId = campusId }
                }
            },
            new JournalEntry
            {
                EntryNumber = "J2",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = cash.Id, Account = cash, Credit = 25_000m, CampusId = campusId },
                    new() { AccountId = payable.Id, Account = payable, Debit = 10_000m, CampusId = campusId }
                }
            }
        };

        var lines = FiscalYearCarryForwardService.BuildOpeningBalanceLines(entries);

        Assert.Equal(2, lines.Count);
        var cashLine = Assert.Single(lines, x => x.AccountId == cash.Id);
        Assert.Equal(125_000m, cashLine.Debit);
        Assert.Equal(0m, cashLine.Credit);
        Assert.Equal(campusId, cashLine.CampusId);

        var payableLine = Assert.Single(lines, x => x.AccountId == payable.Id);
        Assert.Equal(0m, payableLine.Debit);
        Assert.Equal(40_000m, payableLine.Credit);
        Assert.DoesNotContain(lines, x => x.AccountId == revenue.Id);
        Assert.Equal(lines.Sum(x => x.Debit), lines.Sum(x => x.Credit));
    }

    [Fact]
    public void BuildOpeningBalanceLines_preserves_separate_dimension_balances()
    {
        var cash = new Account { Code = "1000", Name = "Cash", AccountType = "Asset" };
        var campusA = Guid.NewGuid();
        var campusB = Guid.NewGuid();

        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "J1",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = cash.Id, Account = cash, Debit = 100_000m, CampusId = campusA },
                    new() { AccountId = cash.Id, Account = cash, Credit = 40_000m, CampusId = campusB },
                    new() { AccountId = Guid.NewGuid(), Account = new Account { Code = "3000", Name = "Capital", AccountType = "Equity" }, Credit = 60_000m }
                }
            }
        };

        var lines = FiscalYearCarryForwardService.BuildOpeningBalanceLines(entries);

        Assert.Equal(3, lines.Count);
        Assert.Contains(lines, x => x.AccountId == cash.Id && x.CampusId == campusA && x.Debit == 100_000m);
        Assert.Contains(lines, x => x.AccountId == cash.Id && x.CampusId == campusB && x.Credit == 40_000m);
    }
}
