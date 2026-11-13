using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261113194500_AddCurrencyToPayrollRecords")]
public sealed class AddCurrencyToPayrollRecords : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Currency",
            table: "PayrollRecords",
            type: "character varying(3)",
            maxLength: 3,
            nullable: false,
            defaultValue: "UGX");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Currency", table: "PayrollRecords");
    }
}