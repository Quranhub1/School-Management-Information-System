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

            migrationBuilder.CreateTable(
                name: "LogbookRequirements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CurriculumId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    YearOfStudy = table.Column<int>(type: "integer", nullable: false),
                    SemesterNumber = table.Column<int>(type: "integer", nullable: false),
                    RequiredQuantity = table.Column<int>(type: "integer", nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogbookRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogbookRequirements_Curricula_CurriculumId",
                        column: x => x.CurriculumId,
                        principalTable: "Curricula",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UhpabFeeReferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    ProgrammeCode = table.Column<string>(type: "text", nullable: true),
                    ProgrammeName = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    SourceUrl = table.Column<string>(type: "text", nullable: false),
                    SourceTitle = table.Column<string>(type: "text", nullable: false),
                    SourceCheckedOn = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UhpabFeeReferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LogbookCompetencyRequirements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LogbookRequirementId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    RequiredCount = table.Column<int>(type: "integer", nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogbookCompetencyRequirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogbookCompetencyRequirements_LogbookRequirements_LogbookRe~",
                        column: x => x.LogbookRequirementId,
                        principalTable: "LogbookRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentLogbooks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    LogbookRequirementId = table.Column<Guid>(type: "uuid", nullable: false),
                    SerialNumber = table.Column<string>(type: "text", nullable: false),
                    IssuedOn = table.Column<DateOnly>(type: "date", nullable: false),
                    SubmittedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IssuedBy = table.Column<string>(type: "text", nullable: true),
                    Remarks = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentLogbooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentLogbooks_LogbookRequirements_LogbookRequirementId",
                        column: x => x.LogbookRequirementId,
                        principalTable: "LogbookRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentLogbooks_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudentLogbookCompetencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentLogbookId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompetencyRequirementId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentPlacementId = table.Column<Guid>(type: "uuid", nullable: true),
                    Outcome = table.Column<string>(type: "text", nullable: false),
                    AssessedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    AssessorName = table.Column<string>(type: "text", nullable: true),
                    AssessorRole = table.Column<string>(type: "text", nullable: true),
                    EvidenceReference = table.Column<string>(type: "text", nullable: true),
                    Remarks = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentLogbookCompetencies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentLogbookCompetencies_LogbookCompetencyRequirements_Co~",
                        column: x => x.CompetencyRequirementId,
                        principalTable: "LogbookCompetencyRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentLogbookCompetencies_StudentLogbooks_StudentLogbookId",
                        column: x => x.StudentLogbookId,
                        principalTable: "StudentLogbooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentLogbookCompetencies_StudentPlacements_StudentPlaceme~",
                        column: x => x.StudentPlacementId,
                        principalTable: "StudentPlacements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdmissionRequirements_ProgrammeId_IsActive",
                table: "AdmissionRequirements",
                columns: new[] { "ProgrammeId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_LogbookCompetencyRequirements_LogbookRequirementId",
                table: "LogbookCompetencyRequirements",
                column: "LogbookRequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_LogbookRequirements_CurriculumId",
                table: "LogbookRequirements",
                column: "CurriculumId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbookCompetencies_CompetencyRequirementId",
                table: "StudentLogbookCompetencies",
                column: "CompetencyRequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbookCompetencies_StudentLogbookId",
                table: "StudentLogbookCompetencies",
                column: "StudentLogbookId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbookCompetencies_StudentPlacementId",
                table: "StudentLogbookCompetencies",
                column: "StudentPlacementId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbooks_LogbookRequirementId",
                table: "StudentLogbooks",
                column: "LogbookRequirementId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbooks_SerialNumber",
                table: "StudentLogbooks",
                column: "SerialNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentLogbooks_StudentId_LogbookRequirementId",
                table: "StudentLogbooks",
                columns: new[] { "StudentId", "LogbookRequirementId" });

            migrationBuilder.CreateIndex(
                name: "IX_UhpabFeeReferences_Category_ProgrammeCode_IsActive",
                table: "UhpabFeeReferences",
                columns: new[] { "Category", "ProgrammeCode", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdmissionRequirements");

            migrationBuilder.DropTable(
                name: "StudentLogbookCompetencies");

            migrationBuilder.DropTable(
                name: "UhpabFeeReferences");

            migrationBuilder.DropTable(
                name: "LogbookCompetencyRequirements");

            migrationBuilder.DropTable(
                name: "StudentLogbooks");

            migrationBuilder.DropTable(
                name: "LogbookRequirements");

            migrationBuilder.DropColumn(
                name: "FinePerOverdueDay",
                table: "LibraryPluginSettings");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LibraryBooks");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "LibraryBooks");

            migrationBuilder.Sql("ALTER TABLE \"Applicants\" ALTER COLUMN \"Status\" TYPE text USING \"Status\"::text;");
        }
    }
}
