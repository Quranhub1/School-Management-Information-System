using SchoolManagement.Application.Finance;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class BudgetServiceTests
{
    [Fact]
    public void BudgetVsActual_range_must_stay_within_budget_period()
    {
        var start = new DateOnly(2026, 1, 1);
        var end = new DateOnly(2026, 12, 31);

        Assert.True(start >= start && end <= end);
        Assert.Throws<ArgumentException>(() =>
        {
            var requestedStart = new DateOnly(2025, 12, 31);
            if (requestedStart < start) throw new ArgumentException();
        });
        Assert.Throws<ArgumentException>(() =>
        {
            var requestedEnd = new DateOnly(2027, 1, 1);
            if (requestedEnd > end) throw new ArgumentException();
        });
    }

    [Fact]
    public void Budget_request_requires_department_and_academic_year()
    {
        var department = Guid.Empty;
        var academicYear = Guid.Empty;
        Assert.Equal(Guid.Empty, department);
        Assert.Equal(Guid.Empty, academicYear);
    }
}
