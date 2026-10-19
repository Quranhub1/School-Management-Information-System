using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public sealed partial class AddCampusAssignmentsAndRecordScoping : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "CampusId",
            table: "CourseRegistrations",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "UserCampusAssignments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                AssignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserCampusAssignments", x => x.Id);
                table.ForeignKey(
                    name: "FK_UserCampusAssignments_Campuses_CampusId",
                    column: x => x.CampusId,
                    principalTable: "Campuses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_UserCampusAssignments_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CourseRegistrations_CampusId",
            table: "CourseRegistrations",
            column: "CampusId");

        migrationBuilder.CreateIndex(
            name: "IX_Students_CampusId",
            table: "Students",
            column: "CampusId");

        migrationBuilder.CreateIndex(
            name: "IX_StaffMembers_CampusId",
            table: "StaffMembers",
            column: "CampusId");

        migrationBuilder.CreateIndex(
            name: "IX_UserCampusAssignments_CampusId",
            table: "UserCampusAssignments",
            column: "CampusId");

        migrationBuilder.CreateIndex(
            name: "IX_UserCampusAssignments_UserId_CampusId",
            table: "UserCampusAssignments",
            columns: new[] { "UserId", "CampusId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_UserCampusAssignments_UserId",
            table: "UserCampusAssignments",
            column: "UserId",
            unique: true,
            filter: "\"IsPrimary\" = TRUE");

        migrationBuilder.AddForeignKey(
            name: "FK_Students_Campuses_CampusId",
            table: "Students",
            column: "CampusId",
            principalTable: "Campuses",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.AddForeignKey(
            name: "FK_StaffMembers_Campuses_CampusId",
            table: "StaffMembers",
            column: "CampusId",
            principalTable: "Campuses",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.AddForeignKey(
            name: "FK_CourseRegistrations_Campuses_CampusId",
            table: "CourseRegistrations",
            column: "CampusId",
            principalTable: "Campuses",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_Students_Campuses_CampusId", table: "Students");
        migrationBuilder.DropForeignKey(name: "FK_StaffMembers_Campuses_CampusId", table: "StaffMembers");
        migrationBuilder.DropForeignKey(name: "FK_CourseRegistrations_Campuses_CampusId", table: "CourseRegistrations");

        migrationBuilder.DropTable(name: "UserCampusAssignments");

        migrationBuilder.DropIndex(name: "IX_Students_CampusId", table: "Students");
        migrationBuilder.DropIndex(name: "IX_StaffMembers_CampusId", table: "StaffMembers");
        migrationBuilder.DropIndex(name: "IX_CourseRegistrations_CampusId", table: "CourseRegistrations");
        migrationBuilder.DropColumn(name: "CampusId", table: "CourseRegistrations");
    }
}
