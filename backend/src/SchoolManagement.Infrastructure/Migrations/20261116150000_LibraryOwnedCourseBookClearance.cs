using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261116150000_LibraryOwnedCourseBookClearance")]
public sealed class LibraryOwnedCourseBookClearance : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "LibraryProgrammeRequirements",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProgrammeId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LibraryProgrammeRequirements", x => x.Id);
                table.ForeignKey("FK_LibraryProgrammeRequirements_Programmes_ProgrammeId", x => x.ProgrammeId, "Programmes", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "LibraryStudentPayments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                RequirementId = table.Column<Guid>(type: "uuid", nullable: false),
                StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                PaymentMethod = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                Reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                RecordedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                RecordedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LibraryStudentPayments", x => x.Id);
                table.ForeignKey("FK_LibraryStudentPayments_LibraryProgrammeRequirements_RequirementId", x => x.RequirementId, "LibraryProgrammeRequirements", "Id", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_LibraryStudentPayments_Students_StudentId", x => x.StudentId, "Students", "Id", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex("IX_LibraryProgrammeRequirements_ProgrammeId_IsActive", "LibraryProgrammeRequirements", new[] { "ProgrammeId", "IsActive" });
        migrationBuilder.CreateIndex("IX_LibraryStudentPayments_RequirementId", "LibraryStudentPayments", "RequirementId");
        migrationBuilder.CreateIndex("IX_LibraryStudentPayments_StudentId_RequirementId_RecordedAtUtc", "LibraryStudentPayments", new[] { "StudentId", "RequirementId", "RecordedAtUtc" });

        // Preserve existing LibraryBook fee settings and posted amounts once, then
        // let the Library module own all future requirement and payment records.
        migrationBuilder.Sql("""
            INSERT INTO "LibraryProgrammeRequirements"
                ("Id", "ProgrammeId", "Name", "Amount", "Currency", "IsActive", "CreatedAtUtc", "UpdatedAtUtc")
            SELECT fs."Id", fs."ProgrammeId", fs."Name", fs."TotalAmount", fs."Currency",
                   fs."IsActive", fs."CreatedAt", fs."CreatedAt"
            FROM "FeeStructures" fs
            WHERE fs."FeeType" = 'LibraryBook'
            ON CONFLICT ("Id") DO NOTHING;

            INSERT INTO "LibraryStudentPayments"
                ("Id", "RequirementId", "StudentId", "Amount", "Currency", "PaymentMethod", "Reference", "RecordedAtUtc", "RecordedBy")
            SELECT gen_random_uuid(), requirement."Id", invoice."StudentId",
                   invoice."PaidAmount", invoice."Currency", 'Legacy payment import',
                   invoice."InvoiceNumber", invoice."IssuedAt", 'System migration'
            FROM "StudentInvoices" invoice
            INNER JOIN "FeeStructures" source_requirement
                ON source_requirement."Id" = invoice."FeeStructureId"
               AND source_requirement."FeeType" = 'LibraryBook'
            JOIN LATERAL (
                SELECT target."Id"
                FROM "LibraryProgrammeRequirements" target
                WHERE target."ProgrammeId" = source_requirement."ProgrammeId"
                ORDER BY target."IsActive" DESC, target."CreatedAtUtc" DESC, target."Id" DESC
                LIMIT 1
            ) requirement ON TRUE
            WHERE invoice."FeeType" = 'LibraryBook' AND invoice."PaidAmount" > 0;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "LibraryStudentPayments");
        migrationBuilder.DropTable(name: "LibraryProgrammeRequirements");
    }
}
