using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261111100000_AddAcademicAuthorities")]
public partial class AddAcademicAuthorities : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AcademicAuthorities",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                SourceReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AcademicAuthorities", x => x.Id));

        migrationBuilder.CreateIndex(name: "IX_AcademicAuthorities_Code", table: "AcademicAuthorities", column: "Code", unique: true);

        migrationBuilder.InsertData(
            table: "AcademicAuthorities",
            columns: new[] { "Id", "Code", "Name", "Description", "SourceReference", "IsActive", "SortOrder" },
            values: new object[,]
            {
                { new Guid("b70a4b18-67a6-49b8-99de-3b43fd2a5d01"), "SCHOOL_BASED", "School-based", "Programmes developed and delivered under the institution's own approved academic framework.", null, true, 1 },
                { new Guid("b70a4b18-67a6-49b8-99de-3b43fd2a5d02"), "UHPAB", "UHPAB", "Uganda Health Professions Assessment Board.", null, true, 2 },
                { new Guid("b70a4b18-67a6-49b8-99de-3b43fd2a5d03"), "UVTAB", "UVTAB", "Uganda Vocational and Technical Assessment Board.", null, true, 3 }
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "AcademicAuthorities");
}
