using SchoolManagement.Api.Validation;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Students;

namespace SchoolManagement.Api.Tests;

public sealed class RequestValidatorTests
{
    [Fact]
    public void CreateAdmissionRequest_requires_all_relationship_ids()
    {
        var validator = new CreateAdmissionRequestValidator();
        var result = validator.Validate(new CreateAdmissionRequest(Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateAdmissionRequest.ApplicantId));
    }

    [Fact]
    public void CreateAdmissionRequest_accepts_complete_request()
    {
        var validator = new CreateAdmissionRequestValidator();
        var result = validator.Validate(new CreateAdmissionRequest(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateStudentRequest_requires_student_number_and_names()
    {
        var validator = new CreateStudentRequestValidator();
        var result = validator.Validate(new CreateStudentRequest("", "", ""));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateStudentRequest.StudentNumber));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateStudentRequest.FirstName));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateStudentRequest.LastName));
    }

    [Fact]
    public void CreateStudentRequest_rejects_invalid_email()
    {
        var validator = new CreateStudentRequestValidator();
        var result = validator.Validate(new CreateStudentRequest("STU-001", "Jane", "Doe", Email: "not-an-email"));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateStudentRequest.Email));
    }

    [Fact]
    public void CreateNoticeRequest_rejects_student_audience()
    {
        var validator = new CreateNoticeRequestValidator();
        var result = validator.Validate(new CreateNoticeRequest("Title", "Body", "General", "Role:Student", null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(CreateNoticeRequest.Audience));
    }
}
