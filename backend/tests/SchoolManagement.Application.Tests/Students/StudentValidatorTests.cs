using FluentValidation.Results;
using SchoolManagement.Application.Students;
using Xunit;

namespace SchoolManagement.Application.Tests.Students;

public sealed class StudentValidatorTests
{
    [Fact]
    public void Create_ValidRequest_Passes()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest(
            "STU-001", "John", "Doe", "Other", new DateOnly(2000, 1, 1), "Male",
            "NAT-001", "0700000000", "john@test.com", Guid.NewGuid());

        ValidationResult result = validator.Validate(request);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Create_MissingStudentNumber_Fails()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest(
            "", "John", "Doe", null, null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentRequest.StudentNumber));
    }

    [Fact]
    public void Create_MissingFirstName_Fails()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest("STU-001", "", "Doe", null, null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentRequest.FirstName));
    }

    [Fact]
    public void Create_MissingLastName_Fails()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest("STU-001", "John", "", null, null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentRequest.LastName));
    }

    [Fact]
    public void Create_StudentNumberTooLong_Fails()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest(
            new string('A', 51), "John", "Doe", null, null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentRequest.StudentNumber));
    }

    [Fact]
    public void Create_InvalidEmail_Fails()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest("STU-001", "John", "Doe", null, null, null, null, null, "not-an-email", null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateStudentRequest.Email));
    }

    [Fact]
    public void Create_OptionalFieldsNull_Passes()
    {
        var validator = new CreateStudentRequestValidator();
        var request = new CreateStudentRequest("STU-001", "John", "Doe", null, null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void Update_ValidRequest_Passes()
    {
        var validator = new UpdateStudentRequestValidator();
        var request = new UpdateStudentRequest(
            Guid.NewGuid(), "STU-001", "John", "Doe", "Other", new DateOnly(2000, 1, 1), "Male",
            "NAT-001", "0700000000", "john@test.com");

        ValidationResult result = validator.Validate(request);

        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Update_EmptyId_Fails()
    {
        var validator = new UpdateStudentRequestValidator();
        var request = new UpdateStudentRequest(
            Guid.Empty, "STU-001", "John", "Doe", null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateStudentRequest.Id));
    }

    [Fact]
    public void Update_MissingStudentNumber_Fails()
    {
        var validator = new UpdateStudentRequestValidator();
        var request = new UpdateStudentRequest(Guid.NewGuid(), "", "John", "Doe", null, null, null, null, null, null);

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateStudentRequest.StudentNumber));
    }

    [Fact]
    public void Update_InvalidEmail_Fails()
    {
        var validator = new UpdateStudentRequestValidator();
        var request = new UpdateStudentRequest(
            Guid.NewGuid(), "STU-001", "John", "Doe", null, null, null, null, null, "not-an-email");

        ValidationResult result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(UpdateStudentRequest.Email));
    }
}
