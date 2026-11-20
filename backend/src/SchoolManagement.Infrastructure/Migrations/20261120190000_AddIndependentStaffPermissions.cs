using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120190000_AddIndependentStaffPermissions")]
public sealed class AddIndependentStaffPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Permissions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Code = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                GroupKey = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_Permissions", x => x.Id));

        migrationBuilder.CreateTable(
            name: "RolePermissions",
            columns: table => new
            {
                RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                PermissionId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                table.ForeignKey("FK_RolePermissions_Permissions_PermissionId", x => x.PermissionId, "Permissions", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_RolePermissions_Roles_RoleId", x => x.RoleId, "Roles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "UserPermissions",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
                IsGranted = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserPermissions", x => new { x.UserId, x.PermissionId });
                table.ForeignKey("FK_UserPermissions_Permissions_PermissionId", x => x.PermissionId, "Permissions", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_UserPermissions_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.AddColumn<Guid>(
            name: "UserId",
            table: "StaffMembers",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(name: "IX_Permissions_Code", table: "Permissions", column: "Code", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Permissions_GroupKey", table: "Permissions", column: "GroupKey");
        migrationBuilder.CreateIndex(name: "IX_RolePermissions_PermissionId", table: "RolePermissions", column: "PermissionId");
        migrationBuilder.CreateIndex(name: "IX_UserPermissions_PermissionId", table: "UserPermissions", column: "PermissionId");
        migrationBuilder.CreateIndex(name: "IX_StaffMembers_UserId", table: "StaffMembers", column: "UserId", unique: true);
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
        migrationBuilder.DropForeignKey(name: "FK_StaffMembers_Users_UserId", table: "StaffMembers");
        migrationBuilder.DropIndex(name: "IX_StaffMembers_UserId", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "UserId", table: "StaffMembers");
        migrationBuilder.DropTable(name: "RolePermissions");
        migrationBuilder.DropTable(name: "UserPermissions");
        migrationBuilder.DropTable(name: "Permissions");
    }
}
