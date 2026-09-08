using FluentAssertions;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class FinanceReportDimensionTests
{
    [Fact]
    public void TrialBalanceRow_can_carry_all_accounting_dimensions()
    {
        var campus = Guid.NewGuid();
        var faculty = Guid.NewGuid();
        var department = Guid.NewGuid();
        var programme = Guid.NewGuid();
        var account = Guid.NewGuid();

        var row = new TrialBalanceRow(account, "4000", "Tuition Revenue", "Revenue", 0m, 1000m, -1000m, campus, faculty, department, programme);

        row.CampusId.Should().Be(campus);
        row.FacultyId.Should().Be(faculty);
        row.DepartmentId.Should().Be(department);
        row.ProgrammeId.Should().Be(programme);
    }

    [Fact]
    public void TrialBalanceRow_without_dimensions_represents_institution_wide_balance()
    {
        var row = new TrialBalanceRow(Guid.NewGuid(), "1000", "Cash", "Asset", 500m, 0m, 500m);

        row.CampusId.Should().BeNull();
        row.FacultyId.Should().BeNull();
        row.DepartmentId.Should().BeNull();
        row.ProgrammeId.Should().BeNull();
    }
}
