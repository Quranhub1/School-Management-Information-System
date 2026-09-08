using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908180000_AddJournalAccountingDimensions")]
public partial class AddJournalAccountingDimensions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(name: "CampusId", table: "JournalEntryLines", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "FacultyId", table: "JournalEntryLines", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "DepartmentId", table: "JournalEntryLines", type: "uuid", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "ProgrammeId", table: "JournalEntryLines", type: "uuid", nullable: true);

        migrationBuilder.CreateIndex(name: "IX_JournalEntryLines_CampusId", table: "JournalEntryLines", column: "CampusId");
        migrationBuilder.CreateIndex(name: "IX_JournalEntryLines_FacultyId", table: "JournalEntryLines", column: "FacultyId");
        migrationBuilder.CreateIndex(name: "IX_JournalEntryLines_DepartmentId", table: "JournalEntryLines", column: "DepartmentId");
        migrationBuilder.CreateIndex(name: "IX_JournalEntryLines_ProgrammeId", table: "JournalEntryLines", column: "ProgrammeId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_JournalEntryLines_CampusId", table: "JournalEntryLines");
        migrationBuilder.DropIndex(name: "IX_JournalEntryLines_FacultyId", table: "JournalEntryLines");
        migrationBuilder.DropIndex(name: "IX_JournalEntryLines_DepartmentId", table: "JournalEntryLines");
        migrationBuilder.DropIndex(name: "IX_JournalEntryLines_ProgrammeId", table: "JournalEntryLines");
        migrationBuilder.DropColumn(name: "CampusId", table: "JournalEntryLines");
        migrationBuilder.DropColumn(name: "FacultyId", table: "JournalEntryLines");
        migrationBuilder.DropColumn(name: "DepartmentId", table: "JournalEntryLines");
        migrationBuilder.DropColumn(name: "ProgrammeId", table: "JournalEntryLines");
    }
}
