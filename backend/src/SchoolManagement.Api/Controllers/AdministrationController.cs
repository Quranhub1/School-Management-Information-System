using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Api.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class AdministrationController(
    AdministrationService service,
    IConfiguration configuration,
    LocalDatabaseBackupService backupService) : ControllerBase
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

    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var isSelf = Guid.TryParse(currentUserId, out var current) && current == id;
        try
        {
            if (isSelf)
            {
                var existingUser = await service.GetUserAsync(id, cancellationToken);
                if (existingUser is null) return NotFound();
                var requestedRoles = (request.Roles ?? Array.Empty<string>())
                    .Where(role => !string.IsNullOrWhiteSpace(role))
                    .Select(role => role.Trim())
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (!requestedRoles.SetEquals(existingUser.Roles))
                    return BadRequest(new { message = "You cannot change your own roles from this screen." });
            }

            var user = await service.UpdateUserAsync(id, request, cancellationToken);
            return user is null ? NotFound() : Ok(user);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("users/{id:guid}/password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return await service.ResetPasswordAsync(id, request.NewPassword, cancellationToken) ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
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

    [HttpGet("backups")]
    public ActionResult<IReadOnlyList<LocalBackupInfo>> ListBackups() => Ok(backupService.ListBackups());

    [HttpGet("backup-directory")]
    public ActionResult<object> GetBackupDirectory() => Ok(new
    {
        directory = backupService.BackupDirectory,
        automaticBackupsEnabled = configuration.GetValue("DatabaseBackups:AutomaticEnabled", true),
        intervalHours = Math.Clamp(configuration.GetValue("DatabaseBackups:IntervalHours", 24), 1, 168)
    });

    [HttpPost("backup")]
    public async Task<IActionResult> Backup(CancellationToken cancellationToken)
    {
        try { return Ok(await backupService.CreateBackupAsync(cancellationToken)); }
        catch (FileNotFoundException ex) { return Problem(ex.Message, statusCode: 500, title: "PostgreSQL backup tools not found"); }
        catch (InvalidOperationException ex) { return Problem(ex.Message, statusCode: 500, title: "Database backup failed"); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        { return Problem($"Could not save the backup locally: {ex.Message}", statusCode: 500, title: "Local backup failed"); }
    }

    public sealed record RestoreLocalBackupRequest(string FileName, string Confirmation);

    [HttpPost("restore")]
    public async Task<IActionResult> Restore([FromBody] RestoreLocalBackupRequest request, CancellationToken cancellationToken)
    {
        if (!string.Equals(request.Confirmation, "RESTORE DATABASE", StringComparison.Ordinal))
            return BadRequest(new { message = "Type RESTORE DATABASE in the confirmation field to proceed." });
        try
        {
            await backupService.RestoreBackupAsync(request.FileName, cancellationToken);
            return Ok(new { message = "Database restore completed successfully. Reload the application before continuing." });
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (FileNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Problem(ex.Message, statusCode: 500, title: "Database restore failed"); }
    }

    public sealed record SetActiveRequest(bool Active);
    public sealed record ResetPasswordRequest(string NewPassword);
}
