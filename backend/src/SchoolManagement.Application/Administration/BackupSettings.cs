namespace SchoolManagement.Application.Administration;

public sealed record BackupSettings
{
    public string BackupPath { get; set; } = "/workspace/app/backups";
}
