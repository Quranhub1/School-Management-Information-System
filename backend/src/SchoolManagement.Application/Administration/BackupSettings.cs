namespace SchoolManagement.Application.Administration;

public sealed record BackupSettings
{
    public string BackupPath { get; init } = "/workspace/app/backups";
}