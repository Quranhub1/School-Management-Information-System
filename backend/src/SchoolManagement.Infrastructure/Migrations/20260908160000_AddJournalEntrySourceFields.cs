using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908160000_AddJournalEntrySourceFields")]
public partial class AddJournalEntrySourceFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SourceType",
            table: "JournalEntries",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "SourceId",
            table: "JournalEntries",
            type: "uuid",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "SourceId",
            table: "JournalEntries");

        migrationBuilder.DropColumn(
            name: "SourceType",
            table: "JournalEntries");
    }
}
