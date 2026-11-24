using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20261124120000_AddSemesterAwareHostelAllocations")]
public sealed class AddSemesterAwareHostelAllocations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "SemesterId",
            table: "HostelAllocations",
            type: "uuid",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "HostelAllocations" AS allocation
            SET "SemesterId" = (
                SELECT semester."Id"
                FROM "Semesters" AS semester
                INNER JOIN "AcademicYears" AS academicYear ON academicYear."Id" = semester."AcademicYearId"
                WHERE semester."IsActive" = TRUE
                  AND academicYear."IsActive" = TRUE
                  AND allocation."StartDate" >= semester."StartDate"
                  AND allocation."StartDate" <= semester."EndDate"
                ORDER BY semester."StartDate" DESC
                LIMIT 1
            )
            WHERE allocation."SemesterId" IS NULL
              AND EXISTS (
                SELECT 1 FROM "Semesters" AS semester
                INNER JOIN "AcademicYears" AS academicYear ON academicYear."Id" = semester."AcademicYearId"
                WHERE semester."IsActive" = TRUE AND academicYear."IsActive" = TRUE
                  AND allocation."StartDate" >= semester."StartDate" AND allocation."StartDate" <= semester."EndDate"
              );
            """);

        migrationBuilder.CreateIndex(
            name: "IX_HostelAllocations_SemesterId",
            table: "HostelAllocations",
            column: "SemesterId");

        migrationBuilder.AddForeignKey(
            name: "FK_HostelAllocations_Semesters_SemesterId",
            table: "HostelAllocations",
            column: "SemesterId",
            principalTable: "Semesters",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS "UX_HostelAllocations_ActiveBed";
            DROP INDEX IF EXISTS "UX_HostelAllocations_ActiveStudent";
            CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveBedSemester"
                ON "HostelAllocations" ("BedId", "SemesterId")
                WHERE "Status" = 'Active' AND "SemesterId" IS NOT NULL;
            CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveStudentSemester"
                ON "HostelAllocations" ("StudentId", "SemesterId")
                WHERE "Status" = 'Active' AND "SemesterId" IS NOT NULL;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS "UX_HostelAllocations_ActiveBedSemester";
            DROP INDEX IF EXISTS "UX_HostelAllocations_ActiveStudentSemester";
            CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveBed"
                ON "HostelAllocations" ("BedId") WHERE "Status" = 'Active';
            CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveStudent"
                ON "HostelAllocations" ("StudentId") WHERE "Status" = 'Active';
            """);
        migrationBuilder.DropForeignKey(
            name: "FK_HostelAllocations_Semesters_SemesterId",
            table: "HostelAllocations");
        migrationBuilder.DropIndex(
            name: "IX_HostelAllocations_SemesterId",
            table: "HostelAllocations");
        migrationBuilder.DropColumn(
            name: "SemesterId",
            table: "HostelAllocations");
    }
}
