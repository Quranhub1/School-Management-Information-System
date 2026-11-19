using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261119100000_AddCurriculumSoftDeleteAndCoursePrerequisites")]
public sealed class AddCurriculumSoftDeleteAndCoursePrerequisites : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsDeleted",
            table: "Curricula",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "DeletedAt",
            table: "Curricula",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "IsDeleted",
            table: "Courses",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "DeletedAt",
            table: "Courses",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "IsDeleted",
            table: "CurriculumCourses",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "DeletedAt",
            table: "CurriculumCourses",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.Sql("""
            CREATE TABLE "CoursePrerequisites" (
                "Id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
                "CourseId" uuid NOT NULL,
                "PrerequisiteCourseId" uuid NOT NULL,
                "IsMandatory" boolean NOT NULL DEFAULT TRUE,
                "MinimumGrade" text NULL,
                CONSTRAINT "FK_CoursePrerequisites_Courses_CourseId"
                    FOREIGN KEY ("CourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_CoursePrerequisites_Courses_PrerequisiteCourseId"
                    FOREIGN KEY ("PrerequisiteCourseId") REFERENCES "Courses" ("Id") ON DELETE CASCADE,
                CONSTRAINT "CK_CoursePrerequisites_DifferentCourses"
                    CHECK ("CourseId" <> "PrerequisiteCourseId")
            );
            CREATE UNIQUE INDEX "IX_CoursePrerequisites_CourseId_PrerequisiteCourseId"
                ON "CoursePrerequisites" ("CourseId", "PrerequisiteCourseId");
            CREATE INDEX "IX_CoursePrerequisites_PrerequisiteCourseId"
                ON "CoursePrerequisites" ("PrerequisiteCourseId");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("CoursePrerequisites");

        migrationBuilder.DropColumn(
            name: "IsDeleted",
            table: "Curricula");

        migrationBuilder.DropColumn(
            name: "DeletedAt",
            table: "Curricula");

        migrationBuilder.DropColumn(
            name: "IsDeleted",
            table: "Courses");

        migrationBuilder.DropColumn(
            name: "DeletedAt",
            table: "Courses");

        migrationBuilder.DropColumn(
            name: "IsDeleted",
            table: "CurriculumCourses");

        migrationBuilder.DropColumn(
            name: "DeletedAt",
            table: "CurriculumCourses");
    }
}
