using Microsoft.Extensions.Options;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Domain.Identity;

namespace SchoolManagement.Application.Administration;

public sealed record UserSummary(Guid Id, string Username, string FirstName, string LastName, string? Email, bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt, IReadOnlyList<string> Roles);
public sealed record CreateUserRequest(string Username, string Password, string FirstName, string LastName, string? Email, IReadOnlyList<string> Roles);
public sealed record UpdateUserRequest(string FirstName, string LastName, string? Email, IReadOnlyList<string> Roles);
public sealed record ResetUserPasswordRequest(string NewPassword);

public sealed class AdministrationService(IUserRepository users, IOptions<BackupSettings> backupSettings)
{
    public Task<IReadOnlyList<UserSummary>> GetUsersAsync(CancellationToken cancellationToken = default) => users.GetUsersAsync(cancellationToken);

    public Task<UserSummary?> GetUserAsync(Guid id, CancellationToken cancellationToken = default) => users.GetUserAsync(id, cancellationToken);

    public async Task<UserSummary> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Username, password, first name, and last name are required.");
        if (request.Password.Length < 8) throw new ArgumentException("Password must contain at least 8 characters.");
        var username = request.Username.Trim();
        if (await users.FindByUsernameAsync(username, cancellationToken) is not null) throw new InvalidOperationException("Username is already in use.");
        var distinctRoles = request.Roles.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (distinctRoles.Length == 0) throw new ArgumentException("At least one role is required.");
        var user = new User { Username = username, PasswordHash = AuthService.HashPassword(request.Password), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Email = request.Email?.Trim(), IsActive = true };
        await users.AddUserAsync(user, distinctRoles, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        return (await users.GetUserAsync(user.Id, cancellationToken))!;
    }

    public async Task<UserSummary?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("First name and last name are required.");
        var roles = request.Roles?.Where(role => !string.IsNullOrWhiteSpace(role)).Select(role => role.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
            ?? Array.Empty<string>();
        if (roles.Length == 0) throw new ArgumentException("At least one role is required.");
        if (roles.Any(role => role.Length > 100)) throw new ArgumentException("A role name is invalid.");
        return await users.UpdateUserAsync(id, request.FirstName.Trim(), request.LastName.Trim(), request.Email, roles, cancellationToken);
    }

    public async Task<bool> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
            throw new ArgumentException("Password must contain at least 8 characters.");
        var user = await users.SetPasswordHashAsync(id, AuthService.HashPassword(newPassword), cancellationToken);
        if (user is null) return false;
        await users.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<UserSummary?> SetActiveAsync(Guid id, bool active, CancellationToken cancellationToken = default)
    {
        var user = await users.SetActiveAsync(id, active, cancellationToken);
        if (user is null) return null;
        await users.SaveChangesAsync(cancellationToken);
        return await users.GetUserAsync(id, cancellationToken);
    }

    public async Task<string> BackupDatabaseAsync(CancellationToken cancellationToken = default)
    {
        // Ensure backup directory exists
        var backupPath = backupSettings.Value.BackupPath;
        if (!Directory.Exists(backupPath))
        {
            Directory.CreateDirectory(backupPath);
        }

        // Generate backup filename with timestamp
        var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMdd_HHmmss");
        var backupFileName = $"school_management_backup_{timestamp}.backup";
        var backupFilePath = Path.Combine(backupPath, backupFileName);

        // Get database connection string from environment or configuration
        // In a real implementation, we would get this from IConfiguration
        // For now, we'll use a hardcoded approach or try to get it from environment
        var connectionString = Environment.GetEnvironmentVariable("SCHOOL_MANAGEMENT_CONNECTION_STRING") 
                              ?? "Host=localhost;Port=5432;Database=school_management;Username=school_management;Password=CHANGE_ME";

        // Parse connection string to get parameters
        var parameters = ParseConnectionString(connectionString);

        // Build pg_dump command
        var pgDumpPath = FindPgDumpPath();
        var arguments = $"--host={parameters["host"]} --port={parameters["port"]} --username={parameters["username"]} --format=custom --blobs --verbose --file=\"{backupFilePath}\" \"{parameters["database"]}\"";

        // Set PGPASSWORD environment variable for authentication
        var envVars = Environment.GetEnvironmentVariables();
        envVars["PGPASSWORD"] = parameters["password"];

        // Execute pg_dump
        var processStartInfo = new ProcessStartInfo
        {
            FileName = pgDumpPath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            EnvironmentVariables = envVars
        };

        using var process = new Process { StartInfo = processStartInfo };
        process.Start();

        string result = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Backup failed: {error}");
        }

        return backupFilePath;
    }

    public async Task RestoreDatabaseAsync(string backupFilePath, CancellationToken cancellationToken = default)
    {
        if (!File.Exists(backupFilePath))
        {
            throw new FileNotFoundException($"Backup file not found: {backupFilePath}");
        }

        // Get database connection string from environment or configuration
        var connectionString = Environment.GetEnvironmentVariable("SCHOOL_MANAGEMENT_CONNECTION_STRING") 
                              ?? "Host=localhost;Port=5432;Database=school_management;Username=school_management;Password=CHANGE_ME";

        // Parse connection string to get parameters
        var parameters = ParseConnectionString(connectionString);

        // Build pg_restore command
        var pgRestorePath = FindPgRestorePath();
        var arguments = $"--host={parameters["host"]} --port={parameters["port"]} --username={parameters["username"]} --dbname={parameters["database"]} --verbose --clean --no-owner --no-privileges \"{backupFilePath}\"";

        // Set PGPASSWORD environment variable for authentication
        var envVars = Environment.GetEnvironmentVariables();
        envVars["PGPASSWORD"] = parameters["password"];

        // Execute pg_restore
        var processStartInfo = new ProcessStartInfo
        {
            FileName = pgRestorePath,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            EnvironmentVariables = envVars
        };

        using var process = new Process { StartInfo = processStartInfo };
        process.Start();

        string result = await process.StandardOutput.ReadToEndAsync();
        string error = await process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"Restore failed: {error}");
        }
    }

    private static Dictionary<string, string> ParseConnectionString(string connectionString)
    {
        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var parts = connectionString.Split(';');

        foreach (var part in parts)
        {
            if (part.Contains('='))
            {
                var kv = part.Split('=', 2);
                var key = kv[0].Trim();
                var value = kv[1].Trim();
                parameters[key] = value;
            }
        }

        // Ensure we have all required parameters
        if (!parameters.ContainsKey("host")) parameters["host"] = "localhost";
        if (!parameters.ContainsKey("port")) parameters["port"] = "5432";
        if (!parameters.ContainsKey("database")) parameters["database"] = "school_management";
        if (!parameters.ContainsKey("username")) parameters["username"] = "school_management";
        if (!parameters.ContainsKey("password")) parameters["password"] = "CHANGE_ME";

        return parameters;
    }

    private static string FindPgDumpPath()
    {
        // Common PostgreSQL installation paths
        var possiblePaths = new[]
        {
            "/usr/bin/pg_dump",
            "/usr/local/bin/pg_dump",
            "/opt/homebrew/bin/pg_dump",
            "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe",
            "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe",
            "C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe",
            "pg_dump" // Assume it's in PATH
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
            {
                return path;
            }
        }

        // If not found in common locations, try to find it in PATH
        return "pg_dump";
    }

    private static string FindPgRestorePath()
    {
        // Common PostgreSQL installation paths
        var possiblePaths = new[]
        {
            "/usr/bin/pg_restore",
            "/usr/local/bin/pg_restore",
            "/opt/homebrew/bin/pg_restore",
            "C:\\Program Files\\PostgreSQL\\15\\bin\\pg_restore.exe",
            "C:\\Program Files\\PostgreSQL\\14\\bin\\pg_restore.exe",
            "C:\\Program Files\\PostgreSQL\\13\\bin\\pg_restore.exe",
            "pg_restore" // Assume it's in PATH
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
            {
                return path;
            }
        }

        // If not found in common locations, try to find it in PATH
        return "pg_restore";
    }
}