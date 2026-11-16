using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class AddLibraryPluginSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "LibraryPluginSettings",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                KohaOpacUrl = table.Column<string>(type: "text", nullable: false),
                KohaApiUrl = table.Column<string>(type: "text", nullable: false),
                KohaUsername = table.Column<string>(type: "text", nullable: true),
                KohaPasswordProtected = table.Column<string>(type: "text", nullable: true),
                DSpaceBaseUrl = table.Column<string>(type: "text", nullable: false),
                DSpaceRestApiUrl = table.Column<string>(type: "text", nullable: false),
                DSpaceOaiPmhUrl = table.Column<string>(type: "text", nullable: false),
                DSpaceUsername = table.Column<string>(type: "text", nullable: true),
                DSpacePasswordProtected = table.Column<string>(type: "text", nullable: true),
                KohaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                DSpaceEnabled = table.Column<bool>(type: "boolean", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_LibraryPluginSettings", x => x.Id));
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "LibraryPluginSettings");
}
