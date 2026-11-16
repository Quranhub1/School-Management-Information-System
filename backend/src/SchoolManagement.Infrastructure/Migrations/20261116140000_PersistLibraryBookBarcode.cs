using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261116140000_PersistLibraryBookBarcode")]
public sealed class PersistLibraryBookBarcode : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "BarcodeValue",
            table: "LibraryBooks",
            type: "text",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "LibraryBooks"
            SET "BarcodeValue" = regexp_replace("Isbn", '[^0-9]', '', 'g')
            WHERE length(regexp_replace("Isbn", '[^0-9]', '', 'g')) = 13
              AND regexp_replace("Isbn", '[^0-9]', '', 'g') ~ '^(978|979)[0-9]{10}$'
              AND (
                SELECT sum((substr(regexp_replace("Isbn", '[^0-9]', '', 'g'), i, 1)::int) *
                  CASE WHEN (i % 2) = 1 THEN 1 ELSE 3 END)
                FROM generate_series(1, 13) AS i
              ) % 10 = 0;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "BarcodeValue", table: "LibraryBooks");
    }
}
