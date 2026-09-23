using Microsoft.EntityFrameworkCore.Migrations;
#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class RepairPayrollRecordSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "PayrollRecords"
            ADD COLUMN IF NOT EXISTS "PaymentMethod" text;
            """);
        migrationBuilder.Sql("""
            ALTER TABLE "PayrollRecords"
            ADD COLUMN IF NOT EXISTS "Reference" text;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive.
    }
}
