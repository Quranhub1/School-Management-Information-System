using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261109120000_AddStudentArchiveLifecycle")]
public sealed class AddStudentArchiveLifecycle : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsArchived", table: "Students", type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "ArchivedAt", table: "Students", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "ArchivedBy", table: "Students", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "ArchiveReason", table: "Students", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "StatusBeforeArchive", table: "Students", type: "text", nullable: true);
        migrationBuilder.CreateIndex(
            name: "IX_Students_IsArchived_CampusId_StudentNumber",
            table: "Students",
            columns: new[] { "IsArchived", "CampusId", "StudentNumber" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Students_IsArchived_CampusId_StudentNumber", table: "Students");
        migrationBuilder.DropColumn(name: "IsArchived", table: "Students");
        migrationBuilder.DropColumn(name: "ArchivedAt", table: "Students");
        migrationBuilder.DropColumn(name: "ArchivedBy", table: "Students");
        migrationBuilder.DropColumn(name: "ArchiveReason", table: "Students");
        migrationBuilder.DropColumn(name: "StatusBeforeArchive", table: "Students");
    }
}
