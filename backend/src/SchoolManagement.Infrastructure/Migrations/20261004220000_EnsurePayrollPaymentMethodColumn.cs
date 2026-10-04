using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20261004220000_EnsurePayrollPaymentMethodColumn")]
public partial class EnsurePayrollPaymentMethodColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "PayrollRecords"
            ADD COLUMN IF NOT EXISTS "PaymentMethod" text;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive: do not remove a live payroll column during rollback.
    }
}
