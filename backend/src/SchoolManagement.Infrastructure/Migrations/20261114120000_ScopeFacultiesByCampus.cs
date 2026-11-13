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
