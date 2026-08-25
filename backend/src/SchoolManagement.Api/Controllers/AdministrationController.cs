using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authorization;
using System.Text;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class AdministrationController(AdministrationService service) : ControllerBase
{
    [HttpGet("users")]
    public Task<IReadOnlyList<UserSummary>> GetUsers(CancellationToken cancellationToken) => service.GetUsersAsync(cancellationToken);

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(CreateUserRequest request, CancellationToken cancellationToken)
    {
        try { return Ok(await service.CreateUserAsync(request, cancellationToken)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("users/{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        if (Guid.TryParse(currentUserId, out var current) && current == id && !request.Active)
            return BadRequest(new { message = "You cannot deactivate your own account." });
        var user = await service.SetActiveAsync(id, request.Active, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet("backup")]
    public IActionResult Backup()
    {
        return File(Encoding.UTF8.GetBytes("-- Database backup placeholder"), "application/sql", "backup.sql");
    }

    [HttpPost("restore")]
    public IActionResult Restore([FromBody] RestoreRequest request)
    {
        return Ok(new { message = "Restore endpoint placeholder. Implement database restore logic." });
    }

    public sealed record SetActiveRequest(bool Active);
    public sealed record RestoreRequest(string BackupData);
}
