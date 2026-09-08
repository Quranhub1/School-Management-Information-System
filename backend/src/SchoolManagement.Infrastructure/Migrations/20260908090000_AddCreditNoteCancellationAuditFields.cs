using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class AddCreditNoteCancellationAuditFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CancelledAt",
            table: "CreditNotes",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CancelledBy",
            table: "CreditNotes",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "CancellationReason",
            table: "CreditNotes",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_CreditNotes_Status",
            table: "CreditNotes",
            column: "Status");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_CreditNotes_Status",
            table: "CreditNotes");

        migrationBuilder.DropColumn(name: "CancelledAt", table: "CreditNotes");
        migrationBuilder.DropColumn(name: "CancelledBy", table: "CreditNotes");
        migrationBuilder.DropColumn(name: "CancellationReason", table: "CreditNotes");
    }
}
