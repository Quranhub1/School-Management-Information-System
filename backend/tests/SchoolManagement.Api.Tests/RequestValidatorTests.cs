using Xunit;
using SchoolManagement.Api.Controllers;
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
    [Fact]
    public void UpdateAdmissionRequest_requires_an_id()
    {
        var result = new UpdateAdmissionRequestValidator().Validate(new UpdateAdmissionRequest(Guid.Empty));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(UpdateAdmissionRequest.Id));
    }

    [Fact]
    public void DecideAdmissionRequest_requires_a_decision()
    {
        var result = new DecideAdmissionRequestValidator().Validate(new DecideAdmissionRequest("", null, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(DecideAdmissionRequest.Decision));
    }

    [Fact]
    public void AdmitApplicantRequest_requires_valid_academic_relationships_and_student_number()
    {
        var request = new AdmitApplicantRequest(Guid.Empty, Guid.Empty, Guid.Empty, "", null, null, null, null);
        var result = new AdmitApplicantRequestValidator().Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(AdmitApplicantRequest.ProgrammeId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(AdmitApplicantRequest.IntakeId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(AdmitApplicantRequest.AcademicYearId));
        Assert.Contains(result.Errors, error => error.PropertyName == nameof(AdmitApplicantRequest.StudentNumber));
    }

}
