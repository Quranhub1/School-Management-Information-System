using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261007160000_RepairFeeStructureCreatedAt")]
public partial class RepairFeeStructureCreatedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $migration$
            BEGIN
                IF to_regclass('public."FeeStructures"') IS NOT NULL THEN
                    ALTER TABLE "FeeStructures"
                        ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone;

                    UPDATE "FeeStructures"
                    SET "CreatedAt" = CURRENT_TIMESTAMP
                    WHERE "CreatedAt" IS NULL;

                    ALTER TABLE "FeeStructures"
                        ALTER COLUMN "CreatedAt" SET DEFAULT CURRENT_TIMESTAMP,
                        ALTER COLUMN "CreatedAt" SET NOT NULL;
                END IF;
            END
            $migration$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // This is a forward-only repair. Dropping the column would erase timestamps
        // and recreate the runtime failure on databases that already had it.
    }
}
