using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize]
public sealed class ModulesController(ModuleAccessService moduleAccessService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAccessibleModules() =>
        Ok(moduleAccessService.GetAccessibleModules(User));
}
