using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLibraryAndAdmissionModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FinePerOverdueDay",
                table: "LibraryPluginSettings",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 1000m);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LibraryBooks",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "LibraryBooks",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.Sql("ALTER TABLE \"Applicants\" ALTER COLUMN \"Status\" TYPE integer USING \"Status\"::integer;");

            migrationBuilder.CreateTable(
                name: "AdmissionRequirements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProgrammeId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequirementType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdmissionRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdmissionRequirements_Programmes_ProgrammeId",
                        column: x => x.ProgrammeId,
                        principalTable: "Programmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdmissionRequirements_ProgrammeId_IsActive",
                table: "AdmissionRequirements",
                columns: new[] { "ProgrammeId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdmissionRequirements");

            migrationBuilder.Sql("ALTER TABLE \"Applicants\" ALTER COLUMN \"Status\" TYPE text USING \"Status\"::text;");

            migrationBuilder.DropColumn(
                name: "FinePerOverdueDay",
                table: "LibraryPluginSettings");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LibraryBooks");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LibraryBooks");
        }
    }
}
