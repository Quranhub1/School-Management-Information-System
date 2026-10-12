using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261012120000_AddStudentApplicationRecords")]
public partial class AddStudentApplicationRecords : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "StudentApplicationRecords",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                ApplicationDataJson = table.Column<string>(type: "jsonb", nullable: false),
                PhotographData = table.Column<byte[]>(type: "bytea", nullable: true),
                PhotographContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                PhotographFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentApplicationRecords", x => x.Id);
                table.ForeignKey(
                    name: "FK_StudentApplicationRecords_Students_StudentId",
                    column: x => x.StudentId,
                    principalTable: "Students",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_StudentApplicationRecords_StudentId",
            table: "StudentApplicationRecords",
            column: "StudentId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "StudentApplicationRecords");
}
