using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class AcademicStructureControllerTests
{
    [Fact]
    public void AcademicYearDatesMustBeOrdered()
    {
        var start = new DateOnly(2026, 1, 1);
        var end = new DateOnly(2026, 12, 31);
        Assert.True(start < end);
    }

    [Fact]
    public void SemesterDatesMustBeOrdered()
    {
        var start = new DateOnly(2026, 1, 1);
        var end = new DateOnly(2026, 6, 30);
        Assert.True(start < end);
    }
}
