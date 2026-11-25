using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations
{
    [Migration("20261125110000_AddTeachingGroupCurriculumAndSemesterIndexes")]
    public partial class AddTeachingGroupCurriculumAndSemesterIndexes : Migration
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
}
