using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;
#nullable disable
namespace SchoolManagement.Infrastructure.Migrations;
[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20260908200000_AddTransportManagement")]
public partial class AddTransportManagement : Migration
{
    protected override void Up(MigrationBuilder m)
    {
        m.Sql("""
CREATE TABLE IF NOT EXISTS "TransportVehicle" ("Id" uuid NOT NULL, "RegistrationNumber" character varying(40) NOT NULL, "VehicleType" character varying(80) NOT NULL, "Capacity" integer NOT NULL, "IsActive" boolean NOT NULL, CONSTRAINT "PK_TransportVehicle" PRIMARY KEY ("Id"));
CREATE UNIQUE INDEX IF NOT EXISTS "IX_TransportVehicle_RegistrationNumber" ON "TransportVehicle" ("RegistrationNumber");
CREATE TABLE IF NOT EXISTS "TransportRoute" ("Id" uuid NOT NULL, "Name" character varying(160) NOT NULL, "PickupPoint" character varying(200), "Destination" character varying(200), "Fee" numeric(18,2) NOT NULL, "IsActive" boolean NOT NULL, CONSTRAINT "PK_TransportRoute" PRIMARY KEY ("Id"));
CREATE TABLE IF NOT EXISTS "TransportAssignment" ("Id" uuid NOT NULL, "StudentId" uuid NOT NULL, "RouteId" uuid NOT NULL, "VehicleId" uuid NOT NULL, "StartDate" date NOT NULL, "EndDate" date, "Status" character varying(20) NOT NULL, CONSTRAINT "PK_TransportAssignment" PRIMARY KEY ("Id"), CONSTRAINT "FK_TransportAssignment_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE RESTRICT, CONSTRAINT "FK_TransportAssignment_TransportRoute_RouteId" FOREIGN KEY ("RouteId") REFERENCES "TransportRoute" ("Id") ON DELETE RESTRICT, CONSTRAINT "FK_TransportAssignment_TransportVehicle_VehicleId" FOREIGN KEY ("VehicleId") REFERENCES "TransportVehicle" ("Id") ON DELETE RESTRICT, CONSTRAINT "CK_TransportAssignment_DateRange" CHECK ("EndDate" IS NULL OR "StartDate" <= "EndDate"));
CREATE INDEX IF NOT EXISTS "IX_TransportAssignment_RouteId" ON "TransportAssignment" ("RouteId");
CREATE INDEX IF NOT EXISTS "IX_TransportAssignment_VehicleId" ON "TransportAssignment" ("VehicleId");
CREATE UNIQUE INDEX IF NOT EXISTS "UX_TransportAssignment_ActiveStudent" ON "TransportAssignment" ("StudentId") WHERE "Status" = 'Active';
""");
    }
    protected override void Down(MigrationBuilder m) => m.Sql("DROP TABLE IF EXISTS \"TransportAssignment\"; DROP TABLE IF EXISTS \"TransportRoute\"; DROP TABLE IF EXISTS \"TransportVehicle\";");
}
