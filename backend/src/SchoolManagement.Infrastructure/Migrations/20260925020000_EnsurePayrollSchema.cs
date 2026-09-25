using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class EnsurePayrollSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "PayrollRecords" (
                "Id" uuid NOT NULL,
                "StaffMemberId" uuid NOT NULL,
                "Month" integer NOT NULL,
                "Year" integer NOT NULL,
                "BasicSalary" numeric NOT NULL,
                "Allowances" numeric NOT NULL,
                "Deductions" numeric NOT NULL,
                "NetPay" numeric NOT NULL,
                "PaymentDate" timestamp with time zone,
                "Status" character varying(20) NOT NULL DEFAULT 'Pending',
                "PaymentMethod" text,
                "Reference" text,
                CONSTRAINT "PK_PayrollRecords" PRIMARY KEY ("Id")
            );
            """);

        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "StaffMemberId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Month" integer NOT NULL DEFAULT 1;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Year" integer NOT NULL DEFAULT 2000;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "BasicSalary" numeric NOT NULL DEFAULT 0;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Allowances" numeric NOT NULL DEFAULT 0;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Deductions" numeric NOT NULL DEFAULT 0;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "NetPay" numeric NOT NULL DEFAULT 0;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "PaymentDate" timestamp with time zone;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Status" character varying(20) NOT NULL DEFAULT 'Pending';""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "PaymentMethod" text;""");
        migrationBuilder.Sql("""ALTER TABLE "PayrollRecords" ADD COLUMN IF NOT EXISTS "Reference" text;""");
        migrationBuilder.Sql("""CREATE INDEX IF NOT EXISTS "IX_PayrollRecords_StaffMemberId" ON "PayrollRecords" ("StaffMemberId");""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive so a repair migration cannot remove live payroll data.
    }
}
