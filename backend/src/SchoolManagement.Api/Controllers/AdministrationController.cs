using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authorization;
using System.Diagnostics;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class AdministrationController(
    AdministrationService service,
    IConfiguration configuration,
    IWebHostEnvironment environment) : ControllerBase
{
    private const long MaximumBackupUploadBytes = 2L * 1024 * 1024 * 1024;

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

    [HttpGet("backup")]
    public async Task<IActionResult> Backup(CancellationToken cancellationToken)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"smis-backup-{Guid.NewGuid():N}.dump");
        try
        {
            var connectionString = configuration.GetConnectionString("SchoolManagement");
            if (string.IsNullOrWhiteSpace(connectionString))
                return Problem("The SchoolManagement database connection string is not configured.", statusCode: 500);

            var connection = new NpgsqlConnectionStringBuilder(connectionString);
            var password = connection.Password;
            connection.Password = string.Empty;
            connection.PersistSecurityInfo = false;

            var start = CreatePgToolStartInfo("pg_dump", connection);
            start.ArgumentList.Add("--format=custom");
            start.ArgumentList.Add("--no-owner");
            start.ArgumentList.Add("--no-privileges");
            start.ArgumentList.Add("--dbname");
            start.ArgumentList.Add(connection.Database);
            start.ArgumentList.Add("--file");
            start.ArgumentList.Add(tempFile);
            start.Environment["PGPASSWORD"] = password;
            start.Environment["PGCONNECT_TIMEOUT"] = "15";

            await RunPgToolAsync(start, cancellationToken);
            if (!System.IO.File.Exists(tempFile) || new FileInfo(tempFile).Length == 0)
                return Problem("pg_dump completed without producing a backup file.", statusCode: 500);

            var fileName = $"smis-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}Z.dump";
            Response.OnCompleted(() =>
            {
                try { System.IO.File.Delete(tempFile); } catch { }
                return Task.CompletedTask;
            });
            return PhysicalFile(tempFile, "application/octet-stream", fileName);
        }
        catch (FileNotFoundException ex)
        {
            return Problem(ex.Message, statusCode: 500, title: "PostgreSQL backup tools not found");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(ex.Message, statusCode: 500, title: "Database backup failed");
        }
        finally
        {
            // A successful file response is deleted in OnCompleted; failures are cleaned here.
            if (Response.StatusCode >= 400)
            {
                try { System.IO.File.Delete(tempFile); } catch { }
            }
        }
    }

    [HttpPost("restore")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumBackupUploadBytes)]
    public async Task<IActionResult> Restore(
        [FromForm] IFormFile? backupFile,
        [FromForm] string? confirmation,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(confirmation, "RESTORE DATABASE", StringComparison.Ordinal))
            return BadRequest(new { message = "Type RESTORE DATABASE in the confirmation field to proceed." });
        if (backupFile is null || backupFile.Length == 0)
            return BadRequest(new { message = "Choose a non-empty PostgreSQL custom-format .dump backup file." });
        if (!string.Equals(Path.GetExtension(backupFile.FileName), ".dump", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only custom-format .dump files created by the SMIS backup action are supported." });

        var tempFile = Path.Combine(Path.GetTempPath(), $"smis-restore-{Guid.NewGuid():N}.dump");
        try
        {
            var connectionString = configuration.GetConnectionString("SchoolManagement");
            if (string.IsNullOrWhiteSpace(connectionString))
                return Problem("The SchoolManagement database connection string is not configured.", statusCode: 500);

            await using (var output = new FileStream(tempFile, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                await backupFile.CopyToAsync(output, cancellationToken);

            var connection = new NpgsqlConnectionStringBuilder(connectionString);
            var password = connection.Password;
            connection.Password = string.Empty;
            connection.PersistSecurityInfo = false;

            var start = CreatePgToolStartInfo("pg_restore", connection);
            start.ArgumentList.Add("--clean");
            start.ArgumentList.Add("--if-exists");
            start.ArgumentList.Add("--no-owner");
            start.ArgumentList.Add("--no-privileges");
            start.ArgumentList.Add("--exit-on-error");
            start.ArgumentList.Add("--single-transaction");
            start.ArgumentList.Add("--dbname");
            start.ArgumentList.Add(connection.ConnectionString);
            start.ArgumentList.Add(tempFile);
            start.Environment["PGPASSWORD"] = password;
            start.Environment["PGCONNECT_TIMEOUT"] = "15";

            await RunPgToolAsync(start, cancellationToken);
            return Ok(new { message = "Database restore completed successfully. Reload the application before continuing." });
        }
        catch (FileNotFoundException ex)
        {
            return Problem(ex.Message, statusCode: 500, title: "PostgreSQL restore tools not found");
        }
        catch (InvalidOperationException ex)
        {
            return Problem(ex.Message, statusCode: 500, title: "Database restore failed");
        }
        finally
        {
            try { System.IO.File.Delete(tempFile); } catch { }
        }
    }

    private ProcessStartInfo CreatePgToolStartInfo(string toolName, NpgsqlConnectionStringBuilder connection)
    {
        var executable = ResolvePgTool(toolName);
        var start = new ProcessStartInfo
        {
            FileName = executable,
            UseShellExecute = false,
            RedirectStandardError = true,
            RedirectStandardOutput = false,
            CreateNoWindow = true,
            WorkingDirectory = environment.ContentRootPath
        };
        start.ArgumentList.Add("--host");
        start.ArgumentList.Add(connection.Host);
        start.ArgumentList.Add("--port");
        start.ArgumentList.Add(connection.Port.ToString(System.Globalization.CultureInfo.InvariantCulture));
        start.ArgumentList.Add("--username");
        start.ArgumentList.Add(connection.Username);
        return start;
    }

    private string ResolvePgTool(string toolName)
    {
        var configured = configuration[$"DatabaseTools:{(toolName == "pg_dump" ? "PgDumpPath" : "PgRestorePath")}"];
        if (!string.IsNullOrWhiteSpace(configured) && System.IO.File.Exists(configured))
            return configured;

        var fromEnvironment = Environment.GetEnvironmentVariable(toolName == "pg_dump" ? "PG_DUMP_PATH" : "PG_RESTORE_PATH");
        if (!string.IsNullOrWhiteSpace(fromEnvironment) && System.IO.File.Exists(fromEnvironment))
            return fromEnvironment;

        var executableName = OperatingSystem.IsWindows() ? $"{toolName}.exe" : toolName;
        var pathDirectories = (Environment.GetEnvironmentVariable("PATH") ?? string.Empty)
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var found = pathDirectories.Select(directory => Path.Combine(directory, executableName))
            .FirstOrDefault(System.IO.File.Exists);
        if (found is not null) return found;

        if (OperatingSystem.IsWindows())
        {
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            var postgresRoot = Path.Combine(programFiles, "PostgreSQL");
            if (Directory.Exists(postgresRoot))
            {
                var candidate = Directory.GetDirectories(postgresRoot)
                    .Select(directory => Path.Combine(directory, "bin", executableName))
                    .Where(System.IO.File.Exists)
                    .OrderByDescending(path => path, StringComparer.OrdinalIgnoreCase)
                    .FirstOrDefault();
                if (candidate is not null) return candidate;
            }
        }

        throw new FileNotFoundException($"Could not find {toolName}. Install PostgreSQL client tools or configure DatabaseTools:{(toolName == "pg_dump" ? "PgDumpPath" : "PgRestorePath")} / the corresponding PG_*_PATH environment variable.");
    }

    private static async Task RunPgToolAsync(ProcessStartInfo start, CancellationToken cancellationToken)
    {
        using var process = new Process { StartInfo = start };
        try
        {
            if (!process.Start()) throw new InvalidOperationException($"Could not start {Path.GetFileName(start.FileName)}.");
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            throw new InvalidOperationException($"Could not start PostgreSQL tool '{Path.GetFileName(start.FileName)}': {ex.Message}", ex);
        }

        var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        var error = await errorTask;
        if (process.ExitCode != 0)
            throw new InvalidOperationException($"{Path.GetFileName(start.FileName)} exited with code {process.ExitCode}: {error.Trim()}");
    }

    public sealed record SetActiveRequest(bool Active);
    public sealed record ResetPasswordRequest(string NewPassword);
}
