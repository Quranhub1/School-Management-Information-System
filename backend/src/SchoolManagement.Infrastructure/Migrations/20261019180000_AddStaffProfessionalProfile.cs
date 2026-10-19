using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261019180000_AddStaffProfessionalProfile")]
public sealed class AddStaffProfessionalProfile : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "JobTitle", table: "StaffMembers", type: "character varying(150)", maxLength: 150, nullable: true);
        migrationBuilder.AddColumn<string>(name: "HighestQualification", table: "StaffMembers", type: "character varying(200)", maxLength: 200, nullable: true);
        migrationBuilder.AddColumn<string>(name: "Speciality", table: "StaffMembers", type: "character varying(200)", maxLength: 200, nullable: true);
        migrationBuilder.AddColumn<string>(name: "ProfessionalRegistration", table: "StaffMembers", type: "character varying(200)", maxLength: 200, nullable: true);
        migrationBuilder.AddColumn<string>(name: "CourseUnitIdsJson", table: "StaffMembers", type: "text", nullable: false, defaultValue: "[]");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "JobTitle", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "HighestQualification", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "Speciality", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "ProfessionalRegistration", table: "StaffMembers");
        migrationBuilder.DropColumn(name: "CourseUnitIdsJson", table: "StaffMembers");
    }
}
