using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261012181500_AddTimetableStaffMemberColumn")]
public sealed class AddTimetableStaffMemberColumn : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "StaffMemberId",
            table: "TimetableEntries",
            type: "uuid",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.Sql("""
            UPDATE "TimetableEntries"
            SET "StaffMemberId" = "TeacherId";
            """);

        migrationBuilder.CreateIndex(
            name: "IX_TimetableEntries_StaffMemberId",
            table: "TimetableEntries",
            column: "StaffMemberId");

        migrationBuilder.AddForeignKey(
            name: "FK_TimetableEntries_StaffMembers_StaffMemberId",
            table: "TimetableEntries",
            column: "StaffMemberId",
            principalTable: "StaffMembers",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_TimetableEntries_StaffMembers_StaffMemberId",
            table: "TimetableEntries");

        migrationBuilder.DropIndex(
            name: "IX_TimetableEntries_StaffMemberId",
            table: "TimetableEntries");

        migrationBuilder.DropColumn(
            name: "StaffMemberId",
            table: "TimetableEntries");
    }
}
