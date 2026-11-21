using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120180000_AddStaffUserLinks")]
public sealed class AddStaffUserLinks : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "StaffUserLinks",
            columns: table => new
            {
                StaffId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StaffUserLinks", x => new { x.StaffId, x.UserId });
                table.ForeignKey(
                    name: "FK_StaffUserLinks_StaffMembers_StaffId",
                    column: x => x.StaffId,
                    principalTable: "staff_members",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_StaffUserLinks_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_StaffUserLinks_StaffId",
            table: "StaffUserLinks",
            column: "StaffId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_StaffUserLinks_UserId",
            table: "StaffUserLinks",
            column: "UserId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "StaffUserLinks");
    }
}
