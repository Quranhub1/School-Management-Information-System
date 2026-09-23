using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20260923020000_RepairTransportAndStudentInvoiceSchema")]
public partial class RepairTransportAndStudentInvoiceSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "StudentInvoices"
            ADD COLUMN IF NOT EXISTS "DiscountAmount" numeric NOT NULL DEFAULT 0;
            """);

        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF to_regclass('public."TransportVehicle"') IS NOT NULL
                   AND to_regclass('public."TransportVehicles"') IS NULL THEN
                    ALTER TABLE "TransportVehicle"
                    RENAME TO "TransportVehicles";
                END IF;

                IF to_regclass('public."TransportRoute"') IS NOT NULL
                   AND to_regclass('public."TransportRoutes"') IS NULL THEN
                    ALTER TABLE "TransportRoute"
                    RENAME TO "TransportRoutes";
                END IF;

                IF to_regclass('public."TransportAssignment"') IS NOT NULL
                   AND to_regclass('public."TransportAssignments"') IS NULL THEN
                    ALTER TABLE "TransportAssignment"
                    RENAME TO "TransportAssignments";
                END IF;
            END $$;
            """);

        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "TransportVehicles"
            (
                "Id" uuid NOT NULL,
                "RegistrationNumber" character varying(40) NOT NULL,
                "VehicleType" character varying(80) NOT NULL,
                "Capacity" integer NOT NULL,
                "IsActive" boolean NOT NULL,
                CONSTRAINT "PK_TransportVehicles" PRIMARY KEY ("Id")
            );
            """);

        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "TransportRoutes"
            (
                "Id" uuid NOT NULL,
                "Name" character varying(160) NOT NULL,
                "PickupPoint" character varying(200),
                "Destination" character varying(200),
                "Fee" numeric(18,2) NOT NULL,
                "IsActive" boolean NOT NULL,
                CONSTRAINT "PK_TransportRoutes" PRIMARY KEY ("Id")
            );
            """);

        migrationBuilder.Sql("""
            CREATE TABLE IF NOT EXISTS "TransportAssignments"
            (
                "Id" uuid NOT NULL,
                "StudentId" uuid NOT NULL,
                "RouteId" uuid NOT NULL,
                "VehicleId" uuid NOT NULL,
                "StartDate" date NOT NULL,
                "EndDate" date,
                "Status" character varying(20) NOT NULL,
                CONSTRAINT "PK_TransportAssignments" PRIMARY KEY ("Id")
            );
            """);

        migrationBuilder.Sql("""
            CREATE UNIQUE INDEX IF NOT EXISTS
                "IX_TransportVehicles_RegistrationNumber"
            ON "TransportVehicles" ("RegistrationNumber");
            """);

        migrationBuilder.Sql("""
            CREATE INDEX IF NOT EXISTS
                "IX_TransportAssignments_RouteId"
            ON "TransportAssignments" ("RouteId");
            """);

        migrationBuilder.Sql("""
            CREATE INDEX IF NOT EXISTS
                "IX_TransportAssignments_VehicleId"
            ON "TransportAssignments" ("VehicleId");
            """);

        migrationBuilder.Sql("""
            CREATE UNIQUE INDEX IF NOT EXISTS
                "IX_TransportAssignments_StudentId"
            ON "TransportAssignments" ("StudentId")
            WHERE "Status" = 'Active';
            """);

        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'FK_TransportAssignments_Students_StudentId'
                      AND conrelid =
                          'public."TransportAssignments"'::regclass
                ) THEN
                    ALTER TABLE "TransportAssignments"
                    ADD CONSTRAINT
                        "FK_TransportAssignments_Students_StudentId"
                    FOREIGN KEY ("StudentId")
                    REFERENCES "Students" ("Id")
                    ON DELETE RESTRICT;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname =
                        'FK_TransportAssignments_TransportRoutes_RouteId'
                      AND conrelid =
                          'public."TransportAssignments"'::regclass
                ) THEN
                    ALTER TABLE "TransportAssignments"
                    ADD CONSTRAINT
                        "FK_TransportAssignments_TransportRoutes_RouteId"
                    FOREIGN KEY ("RouteId")
                    REFERENCES "TransportRoutes" ("Id")
                    ON DELETE RESTRICT;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname =
                        'FK_TransportAssignments_TransportVehicles_VehicleId'
                      AND conrelid =
                          'public."TransportAssignments"'::regclass
                ) THEN
                    ALTER TABLE "TransportAssignments"
                    ADD CONSTRAINT
                        "FK_TransportAssignments_TransportVehicles_VehicleId"
                    FOREIGN KEY ("VehicleId")
                    REFERENCES "TransportVehicles" ("Id")
                    ON DELETE RESTRICT;
                END IF;

                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'CK_TransportAssignment_DateRange'
                      AND conrelid =
                          'public."TransportAssignments"'::regclass
                ) THEN
                    ALTER TABLE "TransportAssignments"
                    ADD CONSTRAINT
                        "CK_TransportAssignment_DateRange"
                    CHECK (
                        "EndDate" IS NULL
                        OR "StartDate" <= "EndDate"
                    );
                END IF;
            END $$;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive.
        // This migration repairs potentially drifted database schema.
        // Automatic rollback must not delete existing transport data.
    }
}
