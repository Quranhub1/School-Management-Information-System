using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261113100000_AddSystemCurrencySettings")]
public sealed class AddSystemCurrencySettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SystemCurrencyCode",
            table: "InstitutionSettings",
            type: "character varying(3)",
            maxLength: 3,
            nullable: false,
            defaultValue: "UGX");
        migrationBuilder.AddColumn<string>(
            name: "SystemCurrencyLocale",
            table: "InstitutionSettings",
            type: "character varying(10)",
            maxLength: 10,
            nullable: false,
            defaultValue: "en-UG");
        migrationBuilder.AddColumn<int>(
            name: "SystemCurrencyFractionDigits",
            table: "InstitutionSettings",
            type: "integer",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SystemCurrencyCode", table: "InstitutionSettings");
        migrationBuilder.DropColumn(name: "SystemCurrencyLocale", table: "InstitutionSettings");
        migrationBuilder.DropColumn(name: "SystemCurrencyFractionDigits", table: "InstitutionSettings");
    }
}
