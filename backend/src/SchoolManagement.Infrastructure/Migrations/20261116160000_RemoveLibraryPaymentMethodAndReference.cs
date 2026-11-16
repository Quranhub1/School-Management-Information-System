using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261116160000_RemoveLibraryPaymentMethodAndReference")]
public sealed class RemoveLibraryPaymentMethodAndReference : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaymentMethod", table: "LibraryStudentPayments");
        migrationBuilder.DropColumn(name: "Reference", table: "LibraryStudentPayments");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PaymentMethod",
            table: "LibraryStudentPayments",
            type: "character varying(40)",
            maxLength: 40,
            nullable: false,
            defaultValue: "Recorded by librarian");

        migrationBuilder.AddColumn<string>(
            name: "Reference",
            table: "LibraryStudentPayments",
            type: "character varying(120)",
            maxLength: 120,
            nullable: true);
    }
}
