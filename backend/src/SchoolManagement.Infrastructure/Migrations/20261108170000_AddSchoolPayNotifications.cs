using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261108170000_AddSchoolPayNotifications")]
public sealed class AddSchoolPayNotifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SchoolPaymentNotifications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ExternalReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                SchoolPayReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                StudentId = table.Column<Guid>(type: "uuid", nullable: true),
                StudentInvoiceId = table.Column<Guid>(type: "uuid", nullable: true),
                Amount = table.Column<decimal>(type: "numeric", nullable: false),
                Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                PhoneNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                PayerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                ErrorMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                RawPayload = table.Column<string>(type: "text", nullable: true),
                ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ProcessedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SchoolPaymentNotifications", x => x.Id);
                table.ForeignKey(
                    name: "FK_SchoolPaymentNotifications_Students_StudentId",
                    column: x => x.StudentId,
                    principalTable: "Students",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_SchoolPaymentNotifications_StudentInvoices_StudentInvoiceId",
                    column: x => x.StudentInvoiceId,
                    principalTable: "StudentInvoices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SchoolPaymentNotifications_ExternalReference",
            table: "SchoolPaymentNotifications",
            column: "ExternalReference",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_SchoolPaymentNotifications_SchoolPayReference",
            table: "SchoolPaymentNotifications",
            column: "SchoolPayReference");

        migrationBuilder.CreateIndex(
            name: "IX_SchoolPaymentNotifications_StudentId_Status",
            table: "SchoolPaymentNotifications",
            columns: new[] { "StudentId", "Status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "SchoolPaymentNotifications");
    }
}
