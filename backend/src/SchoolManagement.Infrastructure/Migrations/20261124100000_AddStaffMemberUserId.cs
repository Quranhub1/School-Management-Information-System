using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261124100000_AddStaffMemberUserId")]
public sealed class AddStaffMemberUserId : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "UserId",
            table: "StaffMembers",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_StaffMembers_UserId",
            table: "StaffMembers",
            column: "UserId",
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_StaffMembers_Users_UserId",
            table: "StaffMembers",
            column: "UserId",
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_StaffMembers_Users_UserId",
            table: "StaffMembers");

        migrationBuilder.DropIndex(
            name: "IX_StaffMembers_UserId",
            table: "StaffMembers");

        migrationBuilder.DropColumn(
            name: "UserId",
            table: "StaffMembers");
    }
}
