using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261011130000_AddSchoolWardenRecords")]
public partial class AddSchoolWardenRecords : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS "WardenRecords" (
    "Id" uuid NOT NULL,
    "Category" character varying(30) NOT NULL,
    "Subject" character varying(200) NOT NULL,
    "StudentName" character varying(200),
    "StudentReference" character varying(100),
    "Details" character varying(4000) NOT NULL,
    "Status" character varying(30) NOT NULL,
    "ActionTaken" character varying(2000),
    "RecordedAtUtc" timestamp with time zone NOT NULL,
    "ClosedAtUtc" timestamp with time zone,
    "RecordedBy" character varying(200) NOT NULL,
    CONSTRAINT "PK_WardenRecords" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_WardenRecords_Category" CHECK ("Category" IN ('CheckIn', 'CheckOut', 'Inspection', 'Maintenance', 'Indiscipline')),
    CONSTRAINT "CK_WardenRecords_Status" CHECK ("Status" IN ('Open', 'InProgress', 'Resolved', 'Closed'))
);
CREATE INDEX IF NOT EXISTS "IX_WardenRecords_Category_Status" ON "WardenRecords" ("Category", "Status");
CREATE INDEX IF NOT EXISTS "IX_WardenRecords_RecordedAtUtc" ON "WardenRecords" ("RecordedAtUtc" DESC);
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"WardenRecords\";");
    }
}
