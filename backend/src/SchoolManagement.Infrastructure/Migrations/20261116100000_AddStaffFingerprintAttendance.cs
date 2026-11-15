using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261116100000_AddStaffFingerprintAttendance")]
public partial class AddStaffFingerprintAttendance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "StaffAttendanceEvents",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StaffMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                EventType = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                RecordedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                DeviceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                CaptureId = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Source = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StaffAttendanceEvents", x => x.Id);
                table.ForeignKey("FK_StaffAttendanceEvents_StaffMembers_StaffMemberId", x => x.StaffMemberId, "StaffMembers", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "StaffFingerprintCredentials",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StaffMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                DeviceFamily = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                TemplateFormat = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                EncryptedTemplate = table.Column<byte[]>(type: "bytea", nullable: false),
                EnrolledAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                EnrolledByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StaffFingerprintCredentials", x => x.Id);
                table.ForeignKey("FK_StaffFingerprintCredentials_StaffMembers_StaffMemberId", x => x.StaffMemberId, "StaffMembers", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("IX_StaffAttendanceEvents_DeviceId_CaptureId", "StaffAttendanceEvents", new[] { "DeviceId", "CaptureId" }, unique: true);
        migrationBuilder.CreateIndex("IX_StaffAttendanceEvents_StaffMemberId_RecordedAtUtc", "StaffAttendanceEvents", new[] { "StaffMemberId", "RecordedAtUtc" });
        migrationBuilder.CreateIndex("IX_StaffFingerprintCredentials_StaffMemberId_IsActive", "StaffFingerprintCredentials", new[] { "StaffMemberId", "IsActive" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "StaffFingerprintCredentials");
        migrationBuilder.DropTable(name: "StaffAttendanceEvents");
    }
}
