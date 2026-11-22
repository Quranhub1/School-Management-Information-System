using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261123120000_AddCurriculumCoreRelationships")]
public sealed class AddCurriculumCoreRelationships : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Fail before changing the schema if imported or legacy records do not
        // point to existing parent records. This preserves the existing catalogue.
        migrationBuilder.Sql("""
            DO $$
            DECLARE orphan_count bigint;
            BEGIN
                SELECT COUNT(*) INTO orphan_count
                FROM "Curricula" child
                LEFT JOIN "Programmes" parent ON parent."Id" = child."ProgrammeId"
                WHERE parent."Id" IS NULL;
                IF orphan_count > 0 THEN
                    RAISE EXCEPTION 'Cannot add Curriculum -> Programme foreign key: % orphan Curricula rows exist.', orphan_count;
                END IF;

                SELECT COUNT(*) INTO orphan_count
                FROM "CurriculumCourses" child
                LEFT JOIN "Curricula" parent ON parent."Id" = child."CurriculumId"
                WHERE parent."Id" IS NULL;
                IF orphan_count > 0 THEN
                    RAISE EXCEPTION 'Cannot add CurriculumCourse -> Curriculum foreign key: % orphan CurriculumCourses rows exist.', orphan_count;
                END IF;

                SELECT COUNT(*) INTO orphan_count
                FROM "CurriculumCourses" child
                LEFT JOIN "Courses" parent ON parent."Id" = child."CourseId"
                WHERE parent."Id" IS NULL;
                IF orphan_count > 0 THEN
                    RAISE EXCEPTION 'Cannot add CurriculumCourse -> Course foreign key: % orphan CurriculumCourses rows exist.', orphan_count;
                END IF;
            END $$;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_Curricula_ProgrammeId",
            table: "Curricula",
            column: "ProgrammeId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumCourses_CourseId",
            table: "CurriculumCourses",
            column: "CourseId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumCourses_CurriculumId",
            table: "CurriculumCourses",
            column: "CurriculumId");

        migrationBuilder.AddForeignKey(
            name: "FK_Curricula_Programmes_ProgrammeId",
            table: "Curricula",
            column: "ProgrammeId",
            principalTable: "Programmes",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_CurriculumCourses_Curricula_CurriculumId",
            table: "CurriculumCourses",
            column: "CurriculumId",
            principalTable: "Curricula",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.AddForeignKey(
            name: "FK_CurriculumCourses_Courses_CourseId",
            table: "CurriculumCourses",
            column: "CourseId",
            principalTable: "Courses",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Curricula_Programmes_ProgrammeId",
            table: "Curricula");

        migrationBuilder.DropForeignKey(
            name: "FK_CurriculumCourses_Curricula_CurriculumId",
            table: "CurriculumCourses");

        migrationBuilder.DropForeignKey(
            name: "FK_CurriculumCourses_Courses_CourseId",
            table: "CurriculumCourses");

        migrationBuilder.DropIndex(name: "IX_Curricula_ProgrammeId", table: "Curricula");
        migrationBuilder.DropIndex(name: "IX_CurriculumCourses_CourseId", table: "CurriculumCourses");
        migrationBuilder.DropIndex(name: "IX_CurriculumCourses_CurriculumId", table: "CurriculumCourses");
    }
}
