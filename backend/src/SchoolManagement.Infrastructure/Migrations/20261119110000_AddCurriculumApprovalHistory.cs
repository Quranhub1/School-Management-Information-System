using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261119110000_AddCurriculumApprovalHistory")]
public partial class AddCurriculumApprovalHistory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CurriculumApprovalHistory",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                CurriculumId = table.Column<Guid>(type: "uuid", nullable: false),
                FromStatus = table.Column<string>(type: "text", nullable: true),
                ToStatus = table.Column<string>(type: "text", nullable: false),
                Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                Actor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ChangedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CurriculumApprovalHistory", x => x.Id);
                table.ForeignKey(
                    name: "FK_CurriculumApprovalHistory_Curricula_CurriculumId",
                    column: x => x.CurriculumId,
                    principalTable: "Curricula",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumApprovalHistory_CurriculumId_ChangedAtUtc",
            table: "CurriculumApprovalHistory",
            columns: new[] { "CurriculumId", "ChangedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CurriculumApprovalHistory");
    }
}
