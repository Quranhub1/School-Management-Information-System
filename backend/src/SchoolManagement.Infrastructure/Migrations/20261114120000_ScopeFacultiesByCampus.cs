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
        migrationBuilder.Sql(@"UPDATE faculties AS faculty SET campus_id = (SELECT campus.id FROM campuses AS campus WHERE campus.institution_id = faculty.institution_id ORDER BY campus.is_active DESC, campus.name LIMIT 1) WHERE faculty.campus_id IS NULL AND EXISTS (SELECT 1 FROM campuses AS campus WHERE campus.institution_id = faculty.institution_id);");
        migrationBuilder.DropIndex(name: "ix_faculties_code", table: "faculties");
        migrationBuilder.CreateIndex(
            name: "ix_faculties_campus_code",
            table: "faculties",
            columns: new[] { "campus_id", "code" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "ix_faculties_campus_code", table: "faculties");
        migrationBuilder.CreateIndex(
            name: "ix_faculties_code",
            table: "faculties",
            columns: new[] { "institution_id", "code" },
            unique: true);
    }
}
