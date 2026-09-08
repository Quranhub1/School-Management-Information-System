using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908193000_AddHostelManagement")]
public partial class AddHostelManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS "Hostels" (
    "Id" uuid NOT NULL,
    "Name" character varying(160) NOT NULL,
    "Description" character varying(500),
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Hostels" PRIMARY KEY ("Id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Hostels_Name" ON "Hostels" ("Name");

CREATE TABLE IF NOT EXISTS "HostelRooms" (
    "Id" uuid NOT NULL,
    "HostelId" uuid NOT NULL,
    "RoomNumber" character varying(50) NOT NULL,
    "Capacity" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_HostelRooms" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HostelRooms_Hostels_HostelId" FOREIGN KEY ("HostelId") REFERENCES "Hostels" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_HostelRooms_Capacity" CHECK ("Capacity" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_HostelRooms_HostelId_RoomNumber" ON "HostelRooms" ("HostelId", "RoomNumber");
CREATE INDEX IF NOT EXISTS "IX_HostelRooms_HostelId" ON "HostelRooms" ("HostelId");

CREATE TABLE IF NOT EXISTS "HostelBeds" (
    "Id" uuid NOT NULL,
    "RoomId" uuid NOT NULL,
    "BedNumber" character varying(50) NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_HostelBeds" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HostelBeds_HostelRooms_RoomId" FOREIGN KEY ("RoomId") REFERENCES "HostelRooms" ("Id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_HostelBeds_RoomId_BedNumber" ON "HostelBeds" ("RoomId", "BedNumber");
CREATE INDEX IF NOT EXISTS "IX_HostelBeds_RoomId" ON "HostelBeds" ("RoomId");

CREATE TABLE IF NOT EXISTS "HostelAllocations" (
    "Id" uuid NOT NULL,
    "BedId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "StartDate" date NOT NULL,
    "EndDate" date,
    "Status" character varying(20) NOT NULL,
    "Notes" character varying(500),
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_HostelAllocations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HostelAllocations_HostelBeds_BedId" FOREIGN KEY ("BedId") REFERENCES "HostelBeds" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_HostelAllocations_Students_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_HostelAllocations_DateRange" CHECK ("EndDate" IS NULL OR "StartDate" <= "EndDate")
);
CREATE INDEX IF NOT EXISTS "IX_HostelAllocations_BedId_Status" ON "HostelAllocations" ("BedId", "Status");
CREATE INDEX IF NOT EXISTS "IX_HostelAllocations_StudentId_Status" ON "HostelAllocations" ("StudentId", "Status");
CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveBed" ON "HostelAllocations" ("BedId") WHERE "Status" = 'Active';
CREATE UNIQUE INDEX IF NOT EXISTS "UX_HostelAllocations_ActiveStudent" ON "HostelAllocations" ("StudentId") WHERE "Status" = 'Active';
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"HostelAllocations\"; DROP TABLE IF EXISTS \"HostelBeds\"; DROP TABLE IF EXISTS \"HostelRooms\"; DROP TABLE IF EXISTS \"Hostels\";");
    }
}
