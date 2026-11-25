using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/modules")]
[Authorize(Policy = AuthorizationPolicies.ModuleAccess)]
public sealed class ModulesController(ModuleAccessService moduleAccessService) : ControllerBase
{
    [HttpGet]
    public IActionResult GetAccessibleModules() =>
        Ok(moduleAccessService.GetAccessibleModules(User));
}
