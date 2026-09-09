using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Application.Authorization;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class AuthorizationBoundaryTests
{
    [Fact]
    public void AdmissionDocumentsControllerRequiresAdmissionsReadByDefault()
    {
        var attribute = typeof(AdmissionDocumentsController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AdmissionsPolicies.Read, attribute!.Policy);
    }

    [Fact]
    public void AdmissionDocumentUploadRequiresAdmissionsManagement()
    {
        var method = typeof(AdmissionDocumentsController).GetMethod("Upload");

        Assert.NotNull(method);
        var attribute = method!.GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AdmissionsPolicies.Management, attribute!.Policy);
    }

    [Fact]
    public void AdministrationControllerRequiresAdministrationPolicy()
    {
        var attribute = typeof(AdministrationController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AuthorizationPolicies.Administration, attribute!.Policy);
    }

    [Fact]
    public void AdmissionsControllerRequiresAdmissionsManagementPolicy()
    {
        var attribute = typeof(AdmissionsController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AdmissionsPolicies.Management, attribute!.Policy);
    }

    [Fact]
    public void AttendanceControllerRequiresAttendanceManagementPolicy()
    {
        var attribute = typeof(AttendanceController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AuthorizationPolicies.AttendanceManagement, attribute!.Policy);
    }

    [Fact]
    public void ExaminationResultsControllerRequiresExaminationManagementPolicy()
    {
        var attribute = typeof(ExaminationResultsController)
            .GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(AuthorizationPolicies.ExaminationManagement, attribute!.Policy);
    }
}
