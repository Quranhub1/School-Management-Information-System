using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Domain.Tests;

public sealed class FiscalPeriodClosingTests
{
    [Fact]
    public void BuildClosingLines_excludes_balance_sheet_accounts_and_preserves_dimensions()
    {
        var revenue = NewAccount("4000", "Tuition income", "Revenue");
        var expense = NewAccount("5000", "Salaries", "Expense");
        var asset = NewAccount("1000", "Bank", "Asset");
        var retainedId = Guid.NewGuid();
        var campusId = Guid.NewGuid();
        var facultyId = Guid.NewGuid();
        var departmentId = Guid.NewGuid();
        var programmeId = Guid.NewGuid();

        var entry = new JournalEntry
        {
            EntryNumber = "J-1",
            Lines = new List<JournalEntryLine>
            {
                new() { AccountId = revenue.Id, Account = revenue, Credit = 1000m, CampusId = campusId, FacultyId = facultyId, DepartmentId = departmentId, ProgrammeId = programmeId },
                new() { AccountId = expense.Id, Account = expense, Debit = 400m, CampusId = campusId, FacultyId = facultyId, DepartmentId = departmentId, ProgrammeId = programmeId },
                new() { AccountId = asset.Id, Account = asset, Debit = 600m, CampusId = campusId }
            }
        };

        var lines = FiscalPeriodClosingService.BuildClosingLines(new[] { entry }, retainedId);

        Assert.Equal(3, lines.Count);
        Assert.Contains(lines, x => x.AccountId == revenue.Id && x.Debit == 1000m && x.Credit == 0m && x.CampusId == campusId && x.FacultyId == facultyId && x.DepartmentId == departmentId && x.ProgrammeId == programmeId);
        Assert.Contains(lines, x => x.AccountId == expense.Id && x.Debit == 0m && x.Credit == 400m && x.CampusId == campusId && x.FacultyId == facultyId && x.DepartmentId == departmentId && x.ProgrammeId == programmeId);
        Assert.Contains(lines, x => x.AccountId == retainedId && x.Debit == 0m && x.Credit == 600m && x.CampusId == campusId && x.FacultyId == facultyId && x.DepartmentId == departmentId && x.ProgrammeId == programmeId);
        Assert.DoesNotContain(lines, x => x.AccountId == asset.Id);
    }

    [Fact]
    public void BuildClosingLines_creates_loss_transfer_when_expenses_exceed_income()
    {
        var revenue = NewAccount("4000", "Tuition income", "Revenue");
        var expense = NewAccount("5000", "Salaries", "Expense");
        var retainedId = Guid.NewGuid();

        var entry = new JournalEntry
        {
            EntryNumber = "J-2",
            Lines = new List<JournalEntryLine>
            {
                new() { AccountId = revenue.Id, Account = revenue, Credit = 200m },
                new() { AccountId = expense.Id, Account = expense, Debit = 700m }
            }
        };

        var lines = FiscalPeriodClosingService.BuildClosingLines(new[] { entry }, retainedId);
        var retained = Assert.Single(lines.Where(x => x.AccountId == retainedId));

        Assert.Equal(500m, retained.Debit);
        Assert.Equal(0m, retained.Credit);
        Assert.Equal(700m, lines.Sum(x => x.Debit));
        Assert.Equal(700m, lines.Sum(x => x.Credit));
    }

    private static Account NewAccount(string code, string name, string type) =>
        new() { Code = code, Name = name, AccountType = type };
}
