using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class PersistInstitutionLogo : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<byte[]>(
            name: "LogoData",
            table: "InstitutionSettings",
            type: "bytea",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "LogoContentType",
            table: "InstitutionSettings",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "LogoData", table: "InstitutionSettings");
        migrationBuilder.DropColumn(name: "LogoContentType", table: "InstitutionSettings");
    }
}
