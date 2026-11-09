using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261109160000_AddMissingStaffDirectoryColumns")]
public sealed class AddMissingStaffDirectoryColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "DepartmentId",
            table: "StaffMembers",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "EmploymentStatus",
            table: "StaffMembers",
            type: "text",
            nullable: false,
            defaultValue: "Active");

        migrationBuilder.AddColumn<string>(
            name: "OtherNames",
            table: "StaffMembers",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "StaffType",
            table: "StaffMembers",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "NonTeaching");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "DepartmentId", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "EmploymentStatus", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "OtherNames", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "StaffType", table: "StaffMembers");
    }
}
