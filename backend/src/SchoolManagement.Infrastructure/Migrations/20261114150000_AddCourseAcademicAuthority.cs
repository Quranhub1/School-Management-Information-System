using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable
namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261114150000_AddCourseAcademicAuthority")]
public partial class AddCourseAcademicAuthority : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "AuthorityCode", table: "Courses", type: "character varying(40)", maxLength: 40, nullable: true);
        migrationBuilder.Sql(@"
            UPDATE ""Courses"" AS course
            SET ""AuthorityCode"" = mapped.""AuthorityCode""
            FROM (
                SELECT mapping.""CourseId"", MIN(UPPER(BTRIM(programme.""Regulator""))) AS ""AuthorityCode""
                FROM ""CurriculumCourses"" AS mapping
                INNER JOIN ""Curricula"" AS curriculum ON curriculum.""Id"" = mapping.""CurriculumId""
                INNER JOIN ""Programmes"" AS programme ON programme.""Id"" = curriculum.""ProgrammeId""
                WHERE programme.""Regulator"" IS NOT NULL AND btrim(programme.""Regulator"") <> ''
                GROUP BY mapping.""CourseId""
                HAVING COUNT(DISTINCT UPPER(BTRIM(programme.""Regulator""))) = 1
            ) AS mapped
            WHERE course.""Id"" = mapped.""CourseId"";
        ");
        migrationBuilder.CreateIndex(name: "IX_Courses_AuthorityCode", table: "Courses", column: "AuthorityCode");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Courses_AuthorityCode", table: "Courses");
        migrationBuilder.DropColumn(name: "AuthorityCode", table: "Courses");
    }
}