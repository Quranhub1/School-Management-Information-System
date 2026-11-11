using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261111120000_AddProgrammeSourceMetadata")]
public partial class AddProgrammeSourceMetadata : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ApprovalStatus", table: "Programmes",
            type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "NeedsVerification");
        migrationBuilder.AddColumn<string>(
            name: "SourceReference", table: "Programmes",
            type: "character varying(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<bool>(
            name: "IsReferenceOnly", table: "Programmes",
            type: "boolean", nullable: false, defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ApprovalStatus", table: "Programmes");
        migrationBuilder.DropColumn(name: "SourceReference", table: "Programmes");
        migrationBuilder.DropColumn(name: "IsReferenceOnly", table: "Programmes");
    }
}
