using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class FiscalPeriodClosingSemanticsTests
{
    [Fact]
    public void BuildClosingLines_ClearsRevenueAndExpense_WhenNetIncomeIsZero()
    {
        var revenue = new Account { Code = "4000", Name = "Tuition Revenue", AccountType = "Revenue" };
        var expense = new Account { Code = "5000", Name = "Operating Expense", AccountType = "Expense" };
        var retainedEarningsId = Guid.NewGuid();
        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "JE-001", EntryDate = DateTime.UtcNow, Status = "Posted",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = revenue.Id, Account = revenue, Credit = 100000m },
                    new() { AccountId = expense.Id, Account = expense, Debit = 100000m }
                }
            }
        };

        var lines = FiscalPeriodClosingService.BuildClosingLines(entries, retainedEarningsId);

        Assert.Equal(2, lines.Count);
        Assert.Contains(lines, x => x.AccountId == revenue.Id && x.Debit == 100000m && x.Credit == 0m);
        Assert.Contains(lines, x => x.AccountId == expense.Id && x.Debit == 0m && x.Credit == 100000m);
        Assert.DoesNotContain(lines, x => x.AccountId == retainedEarningsId);
        Assert.Equal(lines.Sum(x => x.Debit), lines.Sum(x => x.Credit));
    }

    [Fact]
    public void BuildClosingLines_TransfersNetIncomeToRetainedEarnings()
    {
        var revenue = new Account { Code = "4000", Name = "Tuition Revenue", AccountType = "Revenue" };
        var expense = new Account { Code = "5000", Name = "Operating Expense", AccountType = "Expense" };
        var retainedEarningsId = Guid.NewGuid();
        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "JE-002", EntryDate = DateTime.UtcNow, Status = "Posted",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = revenue.Id, Account = revenue, Credit = 150000m },
                    new() { AccountId = expense.Id, Account = expense, Debit = 100000m }
                }
            }
        };

        var lines = FiscalPeriodClosingService.BuildClosingLines(entries, retainedEarningsId);
        var retained = Assert.Single(lines.Where(x => x.AccountId == retainedEarningsId));

        Assert.Equal(50000m, retained.Credit);
        Assert.Equal(0m, retained.Debit);
        Assert.Equal(lines.Sum(x => x.Debit), lines.Sum(x => x.Credit));
    }
}
