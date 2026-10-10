using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261010190000_AddCustomInventoryRegisters")]
public partial class AddCustomInventoryRegisters : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "InventoryRegisters",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SectionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ColumnsJson = table.Column<string>(type: "jsonb", nullable: false),
                RowsJson = table.Column<string>(type: "jsonb", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_InventoryRegisters", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_InventoryRegisters_SectionId",
            table: "InventoryRegisters",
            column: "SectionId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "InventoryRegisters");
    }
}
