using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class OpeningBalanceServiceTests
{
    [Fact]
    public void OpeningBalanceLineRequest_preserves_all_accounting_dimensions()
    {
        var accountId = Guid.NewGuid();
        var campusId = Guid.NewGuid();
        var facultyId = Guid.NewGuid();
        var departmentId = Guid.NewGuid();
        var programmeId = Guid.NewGuid();

        var request = new OpeningBalanceLineRequest(
            accountId,
            125_000m,
            0m,
            "Opening cash",
            campusId,
            facultyId,
            departmentId,
            programmeId);

        Assert.Equal(accountId, request.AccountId);
        Assert.Equal(125_000m, request.Debit);
        Assert.Equal(0m, request.Credit);
        Assert.Equal(campusId, request.CampusId);
        Assert.Equal(facultyId, request.FacultyId);
        Assert.Equal(departmentId, request.DepartmentId);
        Assert.Equal(programmeId, request.ProgrammeId);
    }

    [Fact]
    public void BuildOpeningBalanceLines_excludes_zero_balances_and_non_balance_sheet_accounts()
    {
        var cash = new Account { Code = "1010", Name = "Cash", AccountType = "Asset" };
        var revenue = new Account { Code = "4100", Name = "Tuition", AccountType = "Revenue" };
        var campusId = Guid.NewGuid();

        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "J1",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = cash.Id, Account = cash, Debit = 100_000m, CampusId = campusId },
                    new() { AccountId = cash.Id, Account = cash, Credit = 100_000m, CampusId = campusId },
                    new() { AccountId = revenue.Id, Account = revenue, Credit = 100_000m, CampusId = campusId }
                }
            }
        };

        var lines = FiscalYearCarryForwardService.BuildOpeningBalanceLines(entries);

        Assert.Empty(lines);
    }

    [Fact]
    public void BuildOpeningBalanceLines_preserves_liability_and_equity_credit_balances()
    {
        var payable = new Account { Code = "2100", Name = "Payables", AccountType = "liability" };
        var capital = new Account { Code = "3000", Name = "Capital", AccountType = "EQUITY" };
        var campusId = Guid.NewGuid();

        var entries = new[]
        {
            new JournalEntry
            {
                EntryNumber = "J1",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = payable.Id, Account = payable, Credit = 75_000m, CampusId = campusId },
                    new() { AccountId = capital.Id, Account = capital, Credit = 25_000m, CampusId = campusId }
                }
            },
            new JournalEntry
            {
                EntryNumber = "J2",
                Lines = new List<JournalEntryLine>
                {
                    new() { AccountId = payable.Id, Account = payable, Debit = 15_000m, CampusId = campusId }
                }
            }
        };

        var lines = FiscalYearCarryForwardService.BuildOpeningBalanceLines(entries);

        Assert.Equal(2, lines.Count);
        var payableLine = Assert.Single(lines, x => x.AccountId == payable.Id);
        Assert.Equal(0m, payableLine.Debit);
        Assert.Equal(60_000m, payableLine.Credit);
        var capitalLine = Assert.Single(lines, x => x.AccountId == capital.Id);
        Assert.Equal(0m, capitalLine.Debit);
        Assert.Equal(25_000m, capitalLine.Credit);
        Assert.Equal(85_000m, lines.Sum(x => x.Debit));
        Assert.Equal(85_000m, lines.Sum(x => x.Credit));
    }
}
