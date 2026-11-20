using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120180000_AddCentralPermissionAssignments")]
public sealed class AddCentralPermissionAssignments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Permissions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Code = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Name = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                GroupCode = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                GroupName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
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
                PermissionId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserPermissions", x => new { x.UserId, x.PermissionId });
                table.ForeignKey("FK_UserPermissions_Permissions_PermissionId", x => x.PermissionId, "Permissions", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_UserPermissions_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StaffUserLinks",
            columns: table => new
            {
                StaffId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StaffUserLinks", x => x.StaffId);
                table.ForeignKey("FK_StaffUserLinks_StaffMembers_StaffId", x => x.StaffId, "StaffMembers", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_StaffUserLinks_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(name: "IX_Permissions_Code", table: "Permissions", column: "Code", unique: true);
        migrationBuilder.CreateIndex(name: "IX_Permissions_GroupCode_Code", table: "Permissions", columns: new[] { "GroupCode", "Code" });
        migrationBuilder.CreateIndex(name: "IX_RolePermissions_PermissionId", table: "RolePermissions", column: "PermissionId");
        migrationBuilder.CreateIndex(name: "IX_UserPermissions_PermissionId", table: "UserPermissions", column: "PermissionId");
        migrationBuilder.CreateIndex(name: "IX_StaffUserLinks_UserId", table: "StaffUserLinks", column: "UserId", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "RolePermissions");
        migrationBuilder.DropTable(name: "UserPermissions");
        migrationBuilder.DropTable(name: "StaffUserLinks");
        migrationBuilder.DropTable(name: "Permissions");
    }
}
