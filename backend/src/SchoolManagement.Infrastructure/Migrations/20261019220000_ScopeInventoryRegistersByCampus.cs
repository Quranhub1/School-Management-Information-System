using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public sealed partial class ScopeInventoryRegistersByCampus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_InventoryRegisters_SectionId",
            table: "InventoryRegisters");

        migrationBuilder.AddColumn<Guid?>(
            name: "CampusId",
            table: "InventoryRegisters",
            type: "uuid",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "InventoryRegisters"
            SET "CampusId" = (
                SELECT "Id" FROM "Campuses" ORDER BY "Code" LIMIT 1
            )
            WHERE "CampusId" IS NULL
              AND EXISTS (SELECT 1 FROM "Campuses");
            """);

        migrationBuilder.CreateIndex(
            name: "IX_InventoryRegisters_CampusId_SectionId",
            table: "InventoryRegisters",
            columns: new[] { "CampusId", "SectionId" },
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_InventoryRegisters_Campuses_CampusId",
            table: "InventoryRegisters",
            column: "CampusId",
            principalTable: "Campuses",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_InventoryRegisters_Campuses_CampusId",
            table: "InventoryRegisters");

        migrationBuilder.DropIndex(
            name: "IX_InventoryRegisters_CampusId_SectionId",
            table: "InventoryRegisters");

        migrationBuilder.DropColumn(
            name: "CampusId",
            table: "InventoryRegisters");

        migrationBuilder.CreateIndex(
            name: "IX_InventoryRegisters_SectionId",
            table: "InventoryRegisters",
            column: "SectionId",
            unique: true);
    }
}
