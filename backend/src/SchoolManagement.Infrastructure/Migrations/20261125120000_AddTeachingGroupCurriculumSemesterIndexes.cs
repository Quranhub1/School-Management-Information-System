using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261125120000_AddTeachingGroupCurriculumSemesterIndexes")]
public partial class AddTeachingGroupCurriculumSemesterIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_TeachingGroups_CurriculumId",
            table: "TeachingGroups",
            column: "CurriculumId");

        migrationBuilder.CreateIndex(
            name: "IX_TeachingGroups_SemesterId",
            table: "TeachingGroups",
            column: "SemesterId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_TeachingGroups_CurriculumId",
            table: "TeachingGroups");

        migrationBuilder.DropIndex(
            name: "IX_TeachingGroups_SemesterId",
            table: "TeachingGroups");
    }
}
