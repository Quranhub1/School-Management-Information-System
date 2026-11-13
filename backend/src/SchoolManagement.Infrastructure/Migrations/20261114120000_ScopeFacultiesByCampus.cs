using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261114120000_ScopeFacultiesByCampus")]
public partial class ScopeFacultiesByCampus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"UPDATE ""Faculties"" AS faculty
            SET ""CampusId"" = (
                SELECT campus.""Id"" FROM ""Campuses"" AS campus
                WHERE campus.""InstitutionId"" = faculty.""InstitutionId""
                ORDER BY campus.""IsActive"" DESC, campus.""Name""
                LIMIT 1
            )
            WHERE faculty.""CampusId"" IS NULL
              AND EXISTS (SELECT 1 FROM ""Campuses"" AS campus WHERE campus.""InstitutionId"" = faculty.""InstitutionId"");");

        migrationBuilder.CreateIndex(
            name: "IX_Faculties_CampusId_Code",
            table: "Faculties",
            columns: new[] { "CampusId", "Code" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Faculties_CampusId_Code", table: "Faculties");
    }
}
