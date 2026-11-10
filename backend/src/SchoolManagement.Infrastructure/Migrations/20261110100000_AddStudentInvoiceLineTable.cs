using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261110100000_AddStudentInvoiceLineTable")]
public partial class AddStudentInvoiceLineTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "StudentInvoiceLine",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StudentInvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                Code = table.Column<string>(type: "text", nullable: false),
                Description = table.Column<string>(type: "text", nullable: false),
                Amount = table.Column<decimal>(type: "numeric", nullable: false),
                Currency = table.Column<string>(type: "text", nullable: false),
                IncomeAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentInvoiceLine", x => x.Id);
                table.ForeignKey(
                    name: "FK_StudentInvoiceLine_StudentInvoices_StudentInvoiceId",
                    column: x => x.StudentInvoiceId,
                    principalTable: "StudentInvoices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_StudentInvoiceLine_StudentInvoiceId",
            table: "StudentInvoiceLine",
            column: "StudentInvoiceId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve invoice line data during rollback. This table is a repair
        // for a previously omitted migration in deployed database histories.
    }
}
