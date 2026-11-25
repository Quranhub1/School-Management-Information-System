using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/health")]
public sealed class HealthController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "healthy",
        service = "school-management-api"
    });
}
