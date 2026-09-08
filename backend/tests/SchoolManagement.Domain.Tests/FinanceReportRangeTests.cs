using FluentAssertions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class FinanceReportRangeTests
{
    [Fact]
    public void ValidateReportRange_accepts_ranges_inside_period_including_boundaries()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        var action = () => FinanceReportService.ValidateReportRange(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), period);
        action.Should().NotThrow();
    }

    [Fact]
    public void ValidateReportRange_rejects_ranges_crossing_fiscal_period_boundary()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        var action = () => FinanceReportService.ValidateReportRange(new DateOnly(2026, 12, 1), new DateOnly(2027, 1, 1), period);
        action.Should().Throw<ArgumentException>().WithMessage("*must remain within fiscal period*");
    }

    [Fact]
    public void ValidateReportRange_rejects_reversed_ranges()
    {
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        var action = () => FinanceReportService.ValidateReportRange(new DateOnly(2026, 8, 1), new DateOnly(2026, 7, 31), period);
        action.Should().Throw<ArgumentException>().WithMessage("Report end date cannot be before the start date.");
    }
}
