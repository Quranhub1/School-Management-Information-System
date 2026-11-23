using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261123130000_SeedCourseOfferingsAndTeachingGroups")]
public sealed class SeedCourseOfferingsAndTeachingGroups : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            -- Build operational offerings from the existing academic catalogue.
            -- A course is offered for each active programme, active curriculum
            -- mapping and active semester whose sequence matches the curriculum
            -- semester number. Multiple active curricula are supported; duplicate
            -- programme/course/semester combinations are collapsed.
            WITH eligible_offerings AS (
                SELECT DISTINCT
                    programme."Id" AS "ProgrammeId",
                    course."Id" AS "CourseId",
                    semester."Id" AS "SemesterId",
                    programme."Code" AS "ProgrammeCode",
                    course."Code" AS "CourseCode",
                    academic_year."Name" AS "AcademicYearName",
                    semester."Sequence" AS "SemesterSequence"
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
                WHERE programme."IsActive" = TRUE
                  AND programme."IsReferenceOnly" = FALSE
                  AND curriculum."IsActive" = TRUE
                  AND curriculum."IsDeleted" = FALSE
                  AND mapping."IsDeleted" = FALSE
                  AND course."IsActive" = TRUE
                  AND course."IsDeleted" = FALSE
                  AND semester."IsActive" = TRUE
                  AND academic_year."IsActive" = TRUE
            )
            INSERT INTO "CourseOfferings"
                ("Id", "CourseId", "SemesterId", "ProgrammeId", "OfferingCode", "Status", "Capacity", "IsActive")
            SELECT
                gen_random_uuid(),
                eligible."CourseId",
                eligible."SemesterId",
                eligible."ProgrammeId",
                CONCAT(
                    eligible."ProgrammeCode", '-',
                    eligible."CourseCode", '-',
                    eligible."AcademicYearName", '-S',
                    eligible."SemesterSequence"
                ),
                'Planned',
                NULL,
                TRUE
            FROM eligible_offerings eligible
            WHERE NOT EXISTS (
                SELECT 1
                FROM "CourseOfferings" existing
                WHERE existing."ProgrammeId" = eligible."ProgrammeId"
                  AND existing."CourseId" = eligible."CourseId"
                  AND existing."SemesterId" = eligible."SemesterId"
            );

            -- Every active offering gets one initial delivery stream. Additional
            -- streams can be created later by academic administrators where needed.
            INSERT INTO "TeachingGroups"
                ("Id", "CourseOfferingId", "GroupCode", "Name", "Capacity", "IsActive")
            SELECT
                gen_random_uuid(),
                offering."Id",
                'A',
                'Group A',
                NULL,
                TRUE
            FROM "CourseOfferings" offering
            WHERE offering."IsActive" = TRUE
              AND NOT EXISTS (
                  SELECT 1
                  FROM "TeachingGroups" existing
                  WHERE existing."CourseOfferingId" = offering."Id"
                    AND existing."GroupCode" = 'A'
              );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep seeded offerings and groups on rollback: timetable entries,
        // templates and registrations may already reference these records.
    }
}
