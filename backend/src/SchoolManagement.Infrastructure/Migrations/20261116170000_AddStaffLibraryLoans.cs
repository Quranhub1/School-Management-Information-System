using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261116170000_AddStaffLibraryLoans")]
public partial class AddStaffLibraryLoans : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "MemberType", table: "LibraryLoans", type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Student");
        migrationBuilder.AddColumn<Guid>(name: "StaffMemberId", table: "LibraryLoans", type: "uuid", nullable: true);
        migrationBuilder.AlterColumn<Guid>(name: "StudentId", table: "LibraryLoans", type: "uuid", nullable: true, oldClrType: typeof(Guid), oldType: "uuid");
        migrationBuilder.CreateIndex(name: "IX_LibraryLoans_StaffMemberId_BookId_ReturnedAtUtc", table: "LibraryLoans", columns: new[] { "StaffMemberId", "BookId", "ReturnedAtUtc" });
        migrationBuilder.AddForeignKey(name: "FK_LibraryLoans_StaffMembers_StaffMemberId", table: "LibraryLoans", column: "StaffMemberId", principalTable: "StaffMembers", principalColumn: "Id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddCheckConstraint(name: "CK_LibraryLoans_ExactlyOneMember", table: "LibraryLoans", sql: "(\"StudentId\" IS NOT NULL AND \"StaffMemberId\" IS NULL AND \"MemberType\" = 'Student') OR (\"StudentId\" IS NULL AND \"StaffMemberId\" IS NOT NULL AND \"MemberType\" = 'Staff')");
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(name: "CK_LibraryLoans_ExactlyOneMember", table: "LibraryLoans");
        migrationBuilder.DropForeignKey(name: "FK_LibraryLoans_StaffMembers_StaffMemberId", table: "LibraryLoans");
        migrationBuilder.DropIndex(name: "IX_LibraryLoans_StaffMemberId_BookId_ReturnedAtUtc", table: "LibraryLoans");
        migrationBuilder.DropColumn(name: "MemberType", table: "LibraryLoans");
        migrationBuilder.DropColumn(name: "StaffMemberId", table: "LibraryLoans");
        migrationBuilder.AlterColumn<Guid>(name: "StudentId", table: "LibraryLoans", type: "uuid", nullable: false, oldClrType: typeof(Guid), oldType: "uuid", oldNullable: true);
    }
}
