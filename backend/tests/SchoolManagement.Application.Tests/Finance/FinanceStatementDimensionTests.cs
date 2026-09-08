using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class FinanceStatementDimensionTests
{
    [Fact]
    public void IncomeStatementRows_PreserveEachAccountingDimension()
    {
        var revenue = new Account { Code = "4000", Name = "Tuition Revenue", AccountType = "Revenue" };
        var campusId = Guid.NewGuid();
        var facultyId = Guid.NewGuid();
        var departmentId = Guid.NewGuid();
        var programmeId = Guid.NewGuid();
        var entry = new JournalEntry
        {
            EntryNumber = "JE-001",
            EntryDate = DateTime.UtcNow,
            Status = "Posted",
            Lines = new List<JournalEntryLine>
            {
                new() { AccountId = revenue.Id, Account = revenue, Credit = 150000m, CampusId = campusId, FacultyId = facultyId, DepartmentId = departmentId, ProgrammeId = programmeId }
            }
        };

        var rows = FinanceReportService.BuildIncomeStatementRows(new[] { entry });

        var row = Assert.Single(rows);
        Assert.Equal(150000m, row.Amount);
        Assert.Equal(campusId, row.CampusId);
        Assert.Equal(facultyId, row.FacultyId);
        Assert.Equal(departmentId, row.DepartmentId);
        Assert.Equal(programmeId, row.ProgrammeId);
    }

    [Fact]
    public void IncomeStatementRows_DoNotMergeDifferentDimensions()
    {
        var revenue = new Account { Code = "4000", Name = "Tuition Revenue", AccountType = "Revenue" };
        var campusA = Guid.NewGuid();
        var campusB = Guid.NewGuid();
        var entry = new JournalEntry
        {
            EntryNumber = "JE-002",
            EntryDate = DateTime.UtcNow,
            Status = "Posted",
            Lines = new List<JournalEntryLine>
            {
                new() { AccountId = revenue.Id, Account = revenue, Credit = 100000m, CampusId = campusA },
                new() { AccountId = revenue.Id, Account = revenue, Credit = 75000m, CampusId = campusB }
            }
        };

        var rows = FinanceReportService.BuildIncomeStatementRows(new[] { entry });

        Assert.Equal(2, rows.Count);
        Assert.Contains(rows, x => x.CampusId == campusA && x.Amount == 100000m);
        Assert.Contains(rows, x => x.CampusId == campusB && x.Amount == 75000m);
    }

    [Fact]
    public void BalanceSheetRows_PreserveDimensionsAndSeparateBalances()
    {
        var cash = new Account { Code = "1000", Name = "Cash", AccountType = "Asset" };
        var campusA = Guid.NewGuid();
        var campusB = Guid.NewGuid();
        var entry = new JournalEntry
        {
            EntryNumber = "JE-003",
            EntryDate = DateTime.UtcNow,
            Status = "Posted",
            Lines = new List<JournalEntryLine>
            {
                new() { AccountId = cash.Id, Account = cash, Debit = 300000m, CampusId = campusA },
                new() { AccountId = cash.Id, Account = cash, Debit = 200000m, CampusId = campusB }
            }
        };

        var rows = FinanceReportService.BuildBalanceSheetRows(new[] { entry });

        Assert.Equal(2, rows.Count);
        Assert.Contains(rows, x => x.CampusId == campusA && x.Balance == 300000m);
        Assert.Contains(rows, x => x.CampusId == campusB && x.Balance == 200000m);
    }
}
