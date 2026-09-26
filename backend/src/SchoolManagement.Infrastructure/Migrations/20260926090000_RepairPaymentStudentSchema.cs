using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260926090000_RepairPaymentStudentSchema")]
public partial class RepairPaymentStudentSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "StudentId",
            table: "Payments",
            type: "uuid",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "Payments" AS p
            SET "StudentId" = i."StudentId"
            FROM "StudentInvoices" AS i
            WHERE p."StudentInvoiceId" = i."Id"
              AND p."StudentId" IS NULL;
            """);

        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM "Payments"
                    WHERE "StudentId" IS NULL
                ) THEN
                    RAISE EXCEPTION 'Cannot repair Payments.StudentId: one or more payments reference a missing StudentInvoice';
                END IF;
            END $$;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "StudentId",
            table: "Payments",
            type: "uuid",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uuid",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Payments_StudentId",
            table: "Payments",
            column: "StudentId");

        migrationBuilder.AddForeignKey(
            name: "FK_Payments_Students_StudentId",
            table: "Payments",
            column: "StudentId",
            principalTable: "Students",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Payments_Students_StudentId",
            table: "Payments");

        migrationBuilder.DropIndex(
            name: "IX_Payments_StudentId",
            table: "Payments");

        migrationBuilder.DropColumn(
            name: "StudentId",
            table: "Payments");
    }
}
