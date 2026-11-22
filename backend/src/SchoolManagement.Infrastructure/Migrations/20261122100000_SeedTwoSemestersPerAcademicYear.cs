using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261122100000_SeedTwoSemestersPerAcademicYear")]
public sealed class SeedTwoSemestersPerAcademicYear : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            -- Create the two standard teaching periods for every existing academic year.
            -- Academic-year IDs and dates are preserved; semester dates divide each year
            -- into two consecutive, non-overlapping six-month periods.
            INSERT INTO "Semesters"
                ("Id", "AcademicYearId", "Name", "Sequence", "StartDate", "EndDate", "IsCurrent", "IsActive")
            SELECT
                gen_random_uuid(),
                year_row."Id",
                CASE period.sequence WHEN 1 THEN 'Semester 1' ELSE 'Semester 2' END,
                period.sequence,
                CASE period.sequence
                    WHEN 1 THEN year_row."StartDate"
                    ELSE (year_row."StartDate" + INTERVAL '6 months')::date
                END,
                CASE period.sequence
                    WHEN 1 THEN ((year_row."StartDate" + INTERVAL '6 months')::date - 1)
                    ELSE year_row."EndDate"
                END,
                year_row."IsCurrent"
                    AND CURRENT_DATE >= CASE period.sequence
                        WHEN 1 THEN year_row."StartDate"
                        ELSE (year_row."StartDate" + INTERVAL '6 months')::date
                    END
                    AND CURRENT_DATE <= CASE period.sequence
                        WHEN 1 THEN ((year_row."StartDate" + INTERVAL '6 months')::date - 1)
                        ELSE year_row."EndDate"
                    END,
                TRUE
            FROM "AcademicYears" year_row
            CROSS JOIN (VALUES (1), (2)) AS period(sequence)
            WHERE NOT EXISTS (
                SELECT 1
                FROM "Semesters" existing
                WHERE existing."AcademicYearId" = year_row."Id"
                  AND existing."Sequence" = period.sequence
            );

            -- Ensure only the semester containing today's date is current for the
            -- current academic year. All other years and periods remain non-current.
            UPDATE "Semesters" semester
            SET "IsCurrent" = (
                year_row."IsCurrent"
                AND CURRENT_DATE BETWEEN semester."StartDate" AND semester."EndDate"
            )
            FROM "AcademicYears" year_row
            WHERE semester."AcademicYearId" = year_row."Id";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Retain academic periods on rollback because course offerings,
        // registrations and other academic records may reference their IDs.
    }
}
