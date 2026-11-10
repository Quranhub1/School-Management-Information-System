using SchoolManagement.Application.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class SchoolPaySyncHashTests
{
    [Fact]
    public void Compute_UsesUppercaseMd5OfSchoolCodeFromDateAndPassword()
    {
        var hash = SchoolPaySyncHash.Compute("123456", "2024-01-15", "your_secret_password");

        Assert.Equal("8C25020661588EC8BE2A7452344E8B6F", hash);
    }

    [Theory]
    [InlineData("", "2024-01-15", "password")]
    [InlineData("123456", "", "password")]
    [InlineData("123456", "2024-01-15", "")]
    public void Compute_RejectsMissingAuthenticationParts(string schoolCode, string fromDate, string password)
    {
        Assert.Throws<ArgumentException>(() => SchoolPaySyncHash.Compute(schoolCode, fromDate, password));
    }
}
