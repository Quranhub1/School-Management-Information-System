using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class FiscalPeriodTests
{
    [Fact]
    public void Contains_includes_boundary_dates()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };

        period.Contains(new DateOnly(2026, 1, 1)).Should().BeTrue();
        period.Contains(new DateOnly(2026, 12, 31)).Should().BeTrue();
        period.Contains(new DateOnly(2027, 1, 1)).Should().BeFalse();
    }

    [Fact]
    public void Close_requires_user_and_is_one_way()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };

        period.Invoking(x => x.Close(" ")).Should().Throw<ArgumentException>();
        period.Close("admin");
        period.Status.Should().Be("Closed");
        period.ClosedBy.Should().Be("admin");
        period.Invoking(x => x.Close("admin")).Should().Throw<InvalidOperationException>();
    }
}
