using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261123150000_AddProgrammeYearClassesToTeachingGroups")]
public sealed class AddProgrammeYearClassesToTeachingGroups : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "ProgrammeId", table: "TeachingGroups", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(
            name: "CurriculumId", table: "TeachingGroups", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<int>(
            name: "YearOfStudy", table: "TeachingGroups", type: "integer", nullable: true);
        migrationBuilder.AddColumn<Guid>(
            name: "SemesterId", table: "TeachingGroups", type: "uuid", nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_TeachingGroups_ProgrammeId_CurriculumId_YearOfStudy_SemesterId_GroupCode",
            table: "TeachingGroups",
            columns: new[] { "ProgrammeId", "CurriculumId", "YearOfStudy", "SemesterId", "GroupCode" },
            unique: true,
            filter: "\"ProgrammeId\" IS NOT NULL AND \"CurriculumId\" IS NOT NULL AND \"YearOfStudy\" IS NOT NULL AND \"SemesterId\" IS NOT NULL");

        migrationBuilder.AddForeignKey(
            name: "FK_TeachingGroups_Programmes_ProgrammeId",
            table: "TeachingGroups", column: "ProgrammeId",
            principalTable: "Programmes", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(
            name: "FK_TeachingGroups_Curricula_CurriculumId",
            table: "TeachingGroups", column: "CurriculumId",
            principalTable: "Curricula", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(
            name: "FK_TeachingGroups_Semesters_SemesterId",
            table: "TeachingGroups", column: "SemesterId",
            principalTable: "Semesters", principalColumn: "Id", onDelete: ReferentialAction.Restrict);

        migrationBuilder.Sql("""
            WITH cohort_candidates AS (
                SELECT DISTINCT ON (
                    programme."Id", curriculum."Id", mapping."YearOfStudy", semester."Id"
                )
                    programme."Id" AS "ProgrammeId",
                    curriculum."Id" AS "CurriculumId",
                    mapping."YearOfStudy",
                    semester."Id" AS "SemesterId",
                    programme."Code" AS "ProgrammeCode",
                    offering."Id" AS "CourseOfferingId"
                FROM "Programmes" programme
                INNER JOIN "Curricula" curriculum
                    ON curriculum."ProgrammeId" = programme."Id"
                INNER JOIN "CurriculumCourses" mapping
                    ON mapping."CurriculumId" = curriculum."Id"
                INNER JOIN "Courses" course
                    ON course."Id" = mapping."CourseId"
                INNER JOIN "Semesters" semester
                    ON semester."Sequence" = mapping."SemesterNumber"
                INNER JOIN "AcademicYears" academic_year
                    ON academic_year."Id" = semester."AcademicYearId"
                INNER JOIN "CourseOfferings" offering
                    ON offering."ProgrammeId" = programme."Id"
                   AND offering."CourseId" = course."Id"
                   AND offering."SemesterId" = semester."Id"
                   AND offering."IsActive" = TRUE
                WHERE programme."IsActive" = TRUE
                  AND programme."IsReferenceOnly" = FALSE
                  AND curriculum."IsActive" = TRUE
                  AND curriculum."IsDeleted" = FALSE
                  AND mapping."IsDeleted" = FALSE
                  AND course."IsActive" = TRUE
                  AND course."IsDeleted" = FALSE
                  AND semester."IsActive" = TRUE
                  AND academic_year."IsActive" = TRUE
                ORDER BY programme."Id", curriculum."Id", mapping."YearOfStudy", semester."Id", offering."Id"
            )
            INSERT INTO "TeachingGroups"
                ("Id", "CourseOfferingId", "GroupCode", "Name", "Capacity", "IsActive",
                 "ProgrammeId", "CurriculumId", "YearOfStudy", "SemesterId")
            SELECT
                gen_random_uuid(),
                cohort."CourseOfferingId",
                'A',
                cohort."ProgrammeCode" || ' Year ' || cohort."YearOfStudy"::text,
                NULL,
                TRUE,
                cohort."ProgrammeId",
                cohort."CurriculumId",
                cohort."YearOfStudy",
                cohort."SemesterId"
            FROM cohort_candidates cohort
            WHERE NOT EXISTS (
                SELECT 1
                FROM "TeachingGroups" existing
                WHERE existing."ProgrammeId" = cohort."ProgrammeId"
                  AND existing."CurriculumId" = cohort."CurriculumId"
                  AND existing."YearOfStudy" = cohort."YearOfStudy"
                  AND existing."SemesterId" = cohort."SemesterId"
                  AND existing."GroupCode" = 'A'
            );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Cohort rows may already be referenced by timetable entries and templates.
        // Keep the data and columns on rollback rather than orphaning academic records.
    }
}
