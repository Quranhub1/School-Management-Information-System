using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261113193000_AddCurrencyToJournalEntries")]
public sealed class AddCurrencyToJournalEntries : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Currency",
            table: "JournalEntries",
            type: "character varying(3)",
            maxLength: 3,
            nullable: false,
            defaultValue: "UGX");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Currency", table: "JournalEntries");
    }
}