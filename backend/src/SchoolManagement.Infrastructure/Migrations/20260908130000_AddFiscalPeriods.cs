using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[Migration("20260908130000_AddFiscalPeriods")]
public partial class AddFiscalPeriods : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "FiscalPeriods",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ClosedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                ClosedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_FiscalPeriods", x => x.Id));

        migrationBuilder.CreateIndex(name: "IX_FiscalPeriods_Name", table: "FiscalPeriods", column: "Name", unique: true);
        migrationBuilder.CreateIndex(name: "IX_FiscalPeriods_StartDate_EndDate", table: "FiscalPeriods", columns: new[] { "StartDate", "EndDate" });
        migrationBuilder.Sql("ALTER TABLE \"FiscalPeriods\" ADD CONSTRAINT \"CK_FiscalPeriods_DateRange\" CHECK (\"StartDate\" <= \"EndDate\");");
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "FiscalPeriods");
}
