using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Diagnostics;

namespace SchoolManagement.Api.Services;

public sealed record LocalBackupInfo(string FileName, long SizeBytes, DateTime LastWriteTimeUtc);

public sealed class LocalDatabaseBackupService(IConfiguration configuration, IHostEnvironment environment, ILogger<LocalDatabaseBackupService> logger)
{
    public string BackupDirectory
    {
        get
        {
            var configured = configuration["DatabaseBackups:Directory"] ?? Environment.GetEnvironmentVariable("SMIS_BACKUP_DIRECTORY");
            if (!string.IsNullOrWhiteSpace(configured)) return Path.GetFullPath(Environment.ExpandEnvironmentVariables(configured));
            return OperatingSystem.IsWindows()
                ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "SMIS", "Backups")
                : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "SMIS-Backups");
        }
    }

    public IReadOnlyList<LocalBackupInfo> ListBackups()
    {
        Directory.CreateDirectory(BackupDirectory);
        return Directory.EnumerateFiles(BackupDirectory, "smis-backup-*.dump")
            .Select(path => new FileInfo(path)).OrderByDescending(file => file.LastWriteTimeUtc)
            .Select(file => new LocalBackupInfo(file.Name, file.Length, file.LastWriteTimeUtc)).ToArray();
    }

    public async Task<LocalBackupInfo> CreateBackupAsync(CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("SchoolManagement");
        if (string.IsNullOrWhiteSpace(connectionString)) throw new InvalidOperationException("The SchoolManagement database connection string is not configured.");
        Directory.CreateDirectory(BackupDirectory);
        var destination = Path.Combine(BackupDirectory, $"smis-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}Z.dump");
        var temporary = destination + ".partial";
        var connection = new NpgsqlConnectionStringBuilder(connectionString);
        var start = CreateStartInfo("pg_dump", connection, connection.Password);
        start.ArgumentList.Add("--format=custom");
        start.ArgumentList.Add("--no-owner");
        start.ArgumentList.Add("--no-privileges");
        start.ArgumentList.Add("--dbname");
        start.ArgumentList.Add(connection.Database);
        start.ArgumentList.Add("--file");
        start.ArgumentList.Add(temporary);
        try
        {
            await RunToolAsync(start, cancellationToken);
            if (!File.Exists(temporary) || new FileInfo(temporary).Length == 0) throw new InvalidOperationException("pg_dump completed without producing a non-empty backup.");
            File.Move(temporary, destination, false);
            var file = new FileInfo(destination);
            logger.LogInformation("Created local SMIS database backup {BackupPath} ({SizeBytes} bytes)", destination, file.Length);
            return new LocalBackupInfo(file.Name, file.Length, file.LastWriteTimeUtc);
        }
        finally { try { if (File.Exists(temporary)) File.Delete(temporary); } catch { } }
    }

    public async Task RestoreBackupAsync(string fileName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName ||
            !fileName.StartsWith("smis-backup-", StringComparison.OrdinalIgnoreCase) || !fileName.EndsWith(".dump", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Choose a valid backup file from the local SMIS backup folder.");
        var path = Path.Combine(BackupDirectory, fileName);
        if (!File.Exists(path)) throw new FileNotFoundException("That backup file does not exist in the local backup folder.");
        var connectionString = configuration.GetConnectionString("SchoolManagement");
        if (string.IsNullOrWhiteSpace(connectionString)) throw new InvalidOperationException("The SchoolManagement database connection string is not configured.");
        var connection = new NpgsqlConnectionStringBuilder(connectionString);
        var start = CreateStartInfo("pg_restore", connection, connection.Password);
        foreach (var arg in new[] { "--clean", "--if-exists", "--no-owner", "--no-privileges", "--exit-on-error", "--single-transaction", "--dbname", connection.ConnectionString, path })
            start.ArgumentList.Add(arg);
        await RunToolAsync(start, cancellationToken);
        logger.LogWarning("Restored SMIS database from local backup {BackupPath}", path);
    }

    private ProcessStartInfo CreateStartInfo(string tool, NpgsqlConnectionStringBuilder connection, string password)
    {
        var configured = configuration[$"DatabaseTools:{(tool == "pg_dump" ? "PgDumpPath" : "PgRestorePath")}"]
            ?? Environment.GetEnvironmentVariable(tool == "pg_dump" ? "PG_DUMP_PATH" : "PG_RESTORE_PATH");
        var executable = !string.IsNullOrWhiteSpace(configured) && File.Exists(configured) ? configured : ResolveTool(tool);
        var start = new ProcessStartInfo { FileName = executable, UseShellExecute = false, RedirectStandardError = true, CreateNoWindow = true, WorkingDirectory = environment.ContentRootPath };
        start.ArgumentList.Add("--host"); start.ArgumentList.Add(connection.Host);
        start.ArgumentList.Add("--port"); start.ArgumentList.Add(connection.Port.ToString(System.Globalization.CultureInfo.InvariantCulture));
        start.ArgumentList.Add("--username"); start.ArgumentList.Add(connection.Username);
        start.Environment["PGPASSWORD"] = password; start.Environment["PGCONNECT_TIMEOUT"] = "15";
        return start;
    }

    private static string ResolveTool(string tool)
    {
        var name = OperatingSystem.IsWindows() ? tool + ".exe" : tool;
        foreach (var directory in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var path = Path.Combine(directory, name); if (File.Exists(path)) return path;
        }
        if (OperatingSystem.IsWindows())
        {
            var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "PostgreSQL");
            if (Directory.Exists(root))
            {
                var found = Directory.GetDirectories(root).Select(dir => Path.Combine(dir, "bin", name)).Where(File.Exists).OrderByDescending(x => x, StringComparer.OrdinalIgnoreCase).FirstOrDefault();
                if (found is not null) return found;
            }
        }
        throw new FileNotFoundException($"Could not find {tool}. Install PostgreSQL client tools or configure DatabaseTools paths.");
    }

    private static async Task RunToolAsync(ProcessStartInfo start, CancellationToken cancellationToken)
    {
        using var process = new Process { StartInfo = start };
        if (!process.Start()) throw new InvalidOperationException($"Could not start {Path.GetFileName(start.FileName)}.");
        var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        var error = await errorTask;
        if (process.ExitCode != 0) throw new InvalidOperationException($"{Path.GetFileName(start.FileName)} exited with code {process.ExitCode}: {error.Trim()}");
    }
}

public sealed class ScheduledLocalBackupWorker(LocalDatabaseBackupService backups, IConfiguration configuration, ILogger<ScheduledLocalBackupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("DatabaseBackups:AutomaticEnabled", true)) return;
        var hours = Math.Clamp(configuration.GetValue("DatabaseBackups:IntervalHours", 24), 1, 168);
        var delay = Math.Clamp(configuration.GetValue("DatabaseBackups:FirstRunDelayMinutes", 2), 1, 1440);
        try { await Task.Delay(TimeSpan.FromMinutes(delay), stoppingToken); } catch (OperationCanceledException) { return; }
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await backups.CreateBackupAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception ex) { logger.LogError(ex, "Automatic local SMIS database backup failed."); }
            try { await Task.Delay(TimeSpan.FromHours(hours), stoppingToken); } catch (OperationCanceledException) { return; }
        }
    }
}
