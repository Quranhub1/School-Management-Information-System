using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class RepairStudentInvoiceFeeTypeSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "StudentInvoices"
            ADD COLUMN IF NOT EXISTS "FeeType" text NOT NULL DEFAULT 'Tuition';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive.
        // This migration repairs schema drift and must not remove
        // an existing production column during rollback.
    }
}
