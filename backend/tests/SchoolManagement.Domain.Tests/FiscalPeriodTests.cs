using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Domain.Tests;

public sealed class FiscalPeriodTests
{
    [Fact]
    public void Contains_includes_boundary_dates()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };

        Assert.True(period.Contains(new DateOnly(2026, 1, 1)));
        Assert.True(period.Contains(new DateOnly(2026, 12, 31)));
        Assert.False(period.Contains(new DateOnly(2027, 1, 1)));
    }

    [Fact]
    public void Close_requires_user_and_is_one_way_until_explicit_reopen()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };

        Assert.Throws<ArgumentException>(() => period.Close(" "));
        period.Close("admin");
        Assert.Equal("Closed", period.Status);
        Assert.Equal("admin", period.ClosedBy);
        Assert.NotNull(period.ClosedAt);
        Assert.Throws<InvalidOperationException>(() => period.Close("admin"));
    }

    [Fact]
    public void Reopen_requires_identity_and_clears_closure_metadata()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        period.Close("admin");

        Assert.Throws<ArgumentException>(() => period.Reopen(" "));
        period.Reopen("finance-manager");

        Assert.Equal("Open", period.Status);
        Assert.Null(period.ClosedBy);
        Assert.Null(period.ClosedAt);
        Assert.Throws<InvalidOperationException>(() => period.Reopen("finance-manager"));
    }
}
