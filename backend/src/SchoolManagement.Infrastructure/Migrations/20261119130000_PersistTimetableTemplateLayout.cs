using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261119130000_PersistTimetableTemplateLayout")]
public partial class PersistTimetableTemplateLayout : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TimetableTemplates",
            columns: table => new
            {
                TeachingGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                LayoutJson = table.Column<string>(type: "jsonb", nullable: false, defaultValue: "{}"),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TimetableTemplates", x => x.TeachingGroupId);
                table.ForeignKey(
                    name: "FK_TimetableTemplates_TeachingGroups_TeachingGroupId",
                    column: x => x.TeachingGroupId,
                    principalTable: "TeachingGroups",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "TimetableTemplates");
    }
}
