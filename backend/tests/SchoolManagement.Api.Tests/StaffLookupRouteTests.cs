using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Api.Controllers;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class StaffLookupRouteTests
{
    [Theory]
    [InlineData(nameof(StaffController.GetCourseUnits), "course-units")]
    [InlineData(nameof(StaffController.GetDepartments), "departments")]
    public void Staff_lookup_actions_are_exposed_under_the_expected_api_routes(string actionName, string expectedSuffix)
    {
        var controllerRoute = typeof(StaffController).GetCustomAttribute<RouteAttribute>();
        var action = typeof(StaffController).GetMethod(actionName);
        Assert.NotNull(controllerRoute);
        Assert.NotNull(action);

        var getRoute = action!.GetCustomAttribute<HttpGetAttribute>();
        Assert.NotNull(getRoute);
        Assert.Equal("api/staff", controllerRoute!.Template);
        Assert.Equal(expectedSuffix, getRoute!.Template);
        Assert.Equal($"api/staff/{expectedSuffix}", $"{controllerRoute.Template}/{getRoute.Template}");
    }

    [Fact]
    public void Staff_controller_is_an_api_controller()
    {
        Assert.NotNull(typeof(StaffController).GetCustomAttribute<ApiControllerAttribute>());
    }
}
