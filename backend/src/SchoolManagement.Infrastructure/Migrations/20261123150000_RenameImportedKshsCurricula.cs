using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261123150000_RenameImportedKshsCurricula")]
public partial class RenameImportedKshsCurricula : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Give each imported curriculum a readable title derived from its
        // authoritative programme name. Keep the source/version identifier intact.
        migrationBuilder.Sql("""
            UPDATE "Curricula" AS curriculum
            SET "Title" = btrim(programme."Name") || ' Curriculum 2026'
            FROM "Programmes" AS programme
            WHERE programme."Id" = curriculum."ProgrammeId"
              AND curriculum."Version" = 'KSHS-MASTER-CATALOG-2026-11'
              AND curriculum."IsDeleted" = FALSE
              AND programme."Name" IS NOT NULL
              AND btrim(programme."Name") <> '';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE "Curricula"
            SET "Title" = 'KSHS Master Curriculum & Course Units Catalog — imported source version'
            WHERE "Version" = 'KSHS-MASTER-CATALOG-2026-11'
              AND "IsDeleted" = FALSE;
            """);
    }
}
