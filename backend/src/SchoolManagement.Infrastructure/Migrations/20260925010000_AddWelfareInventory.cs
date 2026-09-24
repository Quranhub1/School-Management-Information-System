using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(Persistence.SchoolManagementDbContext))]
[Migration("20260925010000_AddWelfareInventory")]
public partial class AddWelfareInventory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "WelfareCommodities",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Unit = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                ReorderLevel = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_WelfareCommodities", x => x.Id));

        migrationBuilder.CreateTable(
            name: "WelfareStockTransactions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                CommodityId = table.Column<Guid>(type: "uuid", nullable: false),
                TransactionDate = table.Column<DateOnly>(type: "date", nullable: false),
                TransactionType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Quantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                Supplier = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                BatchNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                ExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                RecordedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_WelfareStockTransactions", x => x.Id);
                table.ForeignKey("FK_WelfareStockTransactions_WelfareCommodities_CommodityId", x => x.CommodityId, "WelfareCommodities", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(name: "IX_WelfareCommodities_Name", table: "WelfareCommodities", column: "Name", unique: true);
        migrationBuilder.CreateIndex(name: "IX_WelfareStockTransactions_CommodityId_TransactionDate", table: "WelfareStockTransactions", columns: new[] { "CommodityId", "TransactionDate" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "WelfareStockTransactions");
        migrationBuilder.DropTable(name: "WelfareCommodities");
    }
}