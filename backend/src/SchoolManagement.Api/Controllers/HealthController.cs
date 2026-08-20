using Microsoft.AspNetCore.Mvc;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "healthy",
        service = "school-management-api"
    });
}
