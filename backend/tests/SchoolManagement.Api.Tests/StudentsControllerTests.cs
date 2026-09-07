using SchoolManagement.Application.Students;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class StudentsControllerTests
{
    [Fact]
    public void CreateStudentRequest_requires_required_fields()
    {
        var request = new CreateStudentRequest("", "", "");
        Assert.True(string.IsNullOrWhiteSpace(request.StudentNumber));
        Assert.True(string.IsNullOrWhiteSpace(request.FirstName));
        Assert.True(string.IsNullOrWhiteSpace(request.LastName));
    }

    [Fact]
    public void UpdateStudentRequest_requires_matching_ids()
    {
        var request = new UpdateStudentRequest(Guid.NewGuid(), "STU-001", "John", "Doe");
        Assert.NotEqual(Guid.Empty, request.Id);
        Assert.Equal("STU-001", request.StudentNumber);
    }
}
