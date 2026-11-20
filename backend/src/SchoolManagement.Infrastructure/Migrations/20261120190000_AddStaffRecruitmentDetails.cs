using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120190000_AddStaffRecruitmentDetails")]
public sealed class AddStaffRecruitmentDetails : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Address", table: "StaffMembers", type: "character varying(1000)", maxLength: 1000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "BankAccountNumber", table: "StaffMembers", type: "character varying(80)", maxLength: 80, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "BankAddress", table: "StaffMembers", type: "character varying(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "BankName", table: "StaffMembers", type: "character varying(150)", maxLength: 150, nullable: true);
        migrationBuilder.AddColumn<decimal>(
            name: "BasicSalary", table: "StaffMembers", type: "numeric(18,2)", precision: 18, scale: 2, nullable: true);
        migrationBuilder.AddColumn<DateOnly>(
            name: "DateOfBirth", table: "StaffMembers", type: "date", nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "Gender", table: "StaffMembers", type: "character varying(30)", maxLength: 30, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "AttendanceMode", table: "StaffMembers", type: "character varying(40)", maxLength: 40, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "PhotographDataUrl", table: "StaffMembers", type: "text", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Address", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "BankAccountNumber", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "BankAddress", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "BankName", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "BasicSalary", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "DateOfBirth", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "Gender", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "AttendanceMode", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "PhotographDataUrl", table: "StaffMembers");
    }
}
