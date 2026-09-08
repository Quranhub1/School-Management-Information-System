using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908170000_AddJournalReversalReference")]
public partial class AddJournalReversalReference : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "ReversalOfJournalEntryId",
            table: "JournalEntries",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_JournalEntries_ReversalOfJournalEntryId",
            table: "JournalEntries",
            column: "ReversalOfJournalEntryId");

        migrationBuilder.AddForeignKey(
            name: "FK_JournalEntries_JournalEntries_ReversalOfJournalEntryId",
            table: "JournalEntries",
            column: "ReversalOfJournalEntryId",
            principalTable: "JournalEntries",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_JournalEntries_JournalEntries_ReversalOfJournalEntryId",
            table: "JournalEntries");

        migrationBuilder.DropIndex(
            name: "IX_JournalEntries_ReversalOfJournalEntryId",
            table: "JournalEntries");

        migrationBuilder.DropColumn(
            name: "ReversalOfJournalEntryId",
            table: "JournalEntries");
    }
}
