using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261011170000_PersistInstitutionGalleryImages")]
public partial class PersistInstitutionGalleryImages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "InstitutionGalleryImages",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Caption = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                ExternalUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                ImageData = table.Column<byte[]>(type: "bytea", nullable: true),
                ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                OriginalFileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                UploadedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_InstitutionGalleryImages", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_InstitutionGalleryImages_UploadedAt",
            table: "InstitutionGalleryImages",
            column: "UploadedAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "InstitutionGalleryImages");
    }
}
