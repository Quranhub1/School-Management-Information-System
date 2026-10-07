using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class RepairFeeStructureItemSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "FeeStructureItem"
            (
                "Id" uuid NOT NULL,
                "FeeStructureId" uuid NOT NULL,
                "Code" character varying(40) NOT NULL,
                "Name" character varying(160) NOT NULL,
                "Amount" numeric(18,2) NOT NULL,
                "Currency" character varying(3) NOT NULL,
                "IncomeAccountId" uuid NULL,
                "SortOrder" integer NOT NULL,
                "IsOptional" boolean NOT NULL,
                CONSTRAINT "PK_FeeStructureItem" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_FeeStructureItem_FeeStructureId_Code"
                ON "FeeStructureItem" ("FeeStructureId", "Code");

            CREATE INDEX IF NOT EXISTS "IX_FeeStructureItem_FeeStructureId_SortOrder"
                ON "FeeStructureItem" ("FeeStructureId", "SortOrder");

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'FK_FeeStructureItem_FeeStructures_FeeStructureId'
                      AND conrelid = '"FeeStructureItem"'::regclass
                ) THEN
                    ALTER TABLE "FeeStructureItem"
                        ADD CONSTRAINT "FK_FeeStructureItem_FeeStructures_FeeStructureId"
                        FOREIGN KEY ("FeeStructureId") REFERENCES "FeeStructures" ("Id") ON DELETE CASCADE;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'FK_FeeStructureItem_Accounts_IncomeAccountId'
                      AND conrelid = '"FeeStructureItem"'::regclass
                ) THEN
                    ALTER TABLE "FeeStructureItem"
                        ADD CONSTRAINT "FK_FeeStructureItem_Accounts_IncomeAccountId"
                        FOREIGN KEY ("IncomeAccountId") REFERENCES "Accounts" ("Id") ON DELETE RESTRICT;
                END IF;
            END
            $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DROP TABLE IF EXISTS "FeeStructureItem";""");
    }
}
