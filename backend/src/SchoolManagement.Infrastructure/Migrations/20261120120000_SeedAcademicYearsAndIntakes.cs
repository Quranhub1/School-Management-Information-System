using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120120000_SeedAcademicYearsAndIntakes")]
public sealed class SeedAcademicYearsAndIntakes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO "AcademicYears"
                ("Id", "Name", "StartDate", "EndDate", "IsCurrent", "IsActive")
            SELECT
                gen_random_uuid(),
                year_value::text || '-' || (year_value + 1)::text,
                make_date(year_value, 1, 1),
                make_date(year_value + 1, 1, 1) - 1,
                year_value = EXTRACT(YEAR FROM CURRENT_DATE)::integer
                    AND NOT EXISTS (SELECT 1 FROM "AcademicYears" WHERE "IsCurrent" = TRUE),
                TRUE
            FROM generate_series(
                2001,
                GREATEST(2125, EXTRACT(YEAR FROM CURRENT_DATE)::integer + 100)
            ) AS years(year_value)
            WHERE NOT EXISTS (
                SELECT 1 FROM "AcademicYears" existing
                WHERE existing."Name" = year_value::text || '-' || (year_value + 1)::text
            );

            UPDATE "Intakes" SET "IsOpen" = FALSE WHERE upper("Code") NOT IN ('JAN', 'AUG');

            UPDATE "Intakes" SET "Name" = 'January Intake', "IsOpen" = TRUE WHERE upper("Code") = 'JAN';
            UPDATE "Intakes" SET "Name" = 'August Intake', "IsOpen" = TRUE WHERE upper("Code") = 'AUG';

            INSERT INTO "Intakes" ("Id", "Name", "Code", "StartDate", "IsOpen")
            SELECT gen_random_uuid(), 'January Intake', 'JAN', DATE '2001-01-01', TRUE
            WHERE NOT EXISTS (SELECT 1 FROM "Intakes" WHERE upper("Code") = 'JAN');

            INSERT INTO "Intakes" ("Id", "Name", "Code", "StartDate", "IsOpen")
            SELECT gen_random_uuid(), 'August Intake', 'AUG', DATE '2001-08-01', TRUE
            WHERE NOT EXISTS (SELECT 1 FROM "Intakes" WHERE upper("Code") = 'AUG');

            WITH ranked_intakes AS (
                SELECT "Id",
                       row_number() OVER (PARTITION BY upper("Code") ORDER BY "StartDate" DESC, "Id") AS position
                FROM "Intakes"
                WHERE upper("Code") IN ('JAN', 'AUG')
            )
            UPDATE "Intakes" intake
            SET "IsOpen" = ranked_intakes.position = 1
            FROM ranked_intakes
            WHERE intake."Id" = ranked_intakes."Id";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep seeded academic years and intake options: they may already be
        // referenced by admissions, semesters and student records.
    }
}
