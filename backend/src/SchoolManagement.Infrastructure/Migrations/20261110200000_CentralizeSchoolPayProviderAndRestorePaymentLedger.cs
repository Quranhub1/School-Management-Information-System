using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261110200000_CentralizeSchoolPayProviderAndRestorePaymentLedger")]
public sealed partial class CentralizeSchoolPayProviderAndRestorePaymentLedger : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SourceChannel",
            table: "Payments",
            type: "character varying(80)",
            maxLength: 80,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ProviderTransactionId",
            table: "Payments",
            type: "character varying(120)",
            maxLength: 120,
            nullable: true);

        migrationBuilder.AlterColumn<Guid>(
            name: "StudentInvoiceId",
            table: "Payments",
            type: "uuid",
            nullable: true,
            oldClrType: typeof(Guid),
            oldType: "uuid");

        migrationBuilder.AddColumn<string>(
            name: "ProviderTransactionId",
            table: "SchoolPaymentNotifications",
            type: "character varying(120)",
            maxLength: 120,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ProviderStatus",
            table: "SchoolPaymentNotifications",
            type: "character varying(40)",
            maxLength: 40,
            nullable: true);

        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM "Payments" p
                    LEFT JOIN "StudentInvoices" i ON i."Id" = p."StudentInvoiceId"
                    WHERE p."StudentInvoiceId" IS NOT NULL AND i."Id" IS NULL
                ) THEN
                    RAISE EXCEPTION 'Cannot add Payments invoice foreign key: orphaned StudentInvoiceId values exist.';
                END IF;

                IF EXISTS (
                    SELECT 1 FROM "Payments"
                    GROUP BY "ReceiptNumber"
                    HAVING COUNT(*) > 1
                ) THEN
                    RAISE EXCEPTION 'Cannot enforce unique payment receipts: duplicate ReceiptNumber values exist.';
                END IF;
            END $$;
            """);

        migrationBuilder.AddForeignKey(
            name: "FK_Payments_StudentInvoices_StudentInvoiceId",
            table: "Payments",
            column: "StudentInvoiceId",
            principalTable: "StudentInvoices",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.CreateIndex(
            name: "IX_Payments_ReceiptNumber",
            table: "Payments",
            column: "ReceiptNumber",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Payments_ProviderTransactionId",
            table: "Payments",
            column: "ProviderTransactionId",
            unique: true,
            filter: "\"ProviderTransactionId\" IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_Payments_StudentInvoiceId_PaidAt",
            table: "Payments",
            columns: new[] { "StudentInvoiceId", "PaidAt" });

        migrationBuilder.CreateTable(
            name: "PaymentAllocations",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                StudentInvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                AllocatedAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                AllocatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PaymentAllocations", x => x.Id);
                table.ForeignKey(
                    name: "FK_PaymentAllocations_Payments_PaymentId",
                    column: x => x.PaymentId,
                    principalTable: "Payments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_PaymentAllocations_StudentInvoices_StudentInvoiceId",
                    column: x => x.StudentInvoiceId,
                    principalTable: "StudentInvoices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PaymentAllocations_StudentInvoiceId",
            table: "PaymentAllocations",
            column: "StudentInvoiceId");

        migrationBuilder.CreateIndex(
            name: "IX_PaymentAllocations_PaymentId_StudentInvoiceId",
            table: "PaymentAllocations",
            columns: new[] { "PaymentId", "StudentInvoiceId" },
            unique: true);

        migrationBuilder.CreateTable(
            name: "PaymentLedgerEntries",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                StudentInvoiceId = table.Column<Guid>(type: "uuid", nullable: true),
                PaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                PaymentAllocationId = table.Column<Guid>(type: "uuid", nullable: true),
                EntryDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                EntryType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PaymentLedgerEntries", x => x.Id);
                table.ForeignKey(
                    name: "FK_PaymentLedgerEntries_PaymentAllocations_PaymentAllocationId",
                    column: x => x.PaymentAllocationId,
                    principalTable: "PaymentAllocations",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_PaymentLedgerEntries_Payments_PaymentId",
                    column: x => x.PaymentId,
                    principalTable: "Payments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_PaymentLedgerEntries_StudentInvoices_StudentInvoiceId",
                    column: x => x.StudentInvoiceId,
                    principalTable: "StudentInvoices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_PaymentLedgerEntries_Students_StudentId",
                    column: x => x.StudentId,
                    principalTable: "Students",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PaymentLedgerEntries_PaymentAllocationId",
            table: "PaymentLedgerEntries",
            column: "PaymentAllocationId");

        migrationBuilder.CreateIndex(
            name: "IX_PaymentLedgerEntries_PaymentId",
            table: "PaymentLedgerEntries",
            column: "PaymentId");

        migrationBuilder.CreateIndex(
            name: "IX_PaymentLedgerEntries_StudentInvoiceId",
            table: "PaymentLedgerEntries",
            column: "StudentInvoiceId");

        migrationBuilder.CreateIndex(
            name: "IX_PaymentLedgerEntries_StudentId_EntryDate",
            table: "PaymentLedgerEntries",
            columns: new[] { "StudentId", "EntryDate" });

        migrationBuilder.CreateIndex(
            name: "IX_SchoolPaymentNotifications_ProviderTransactionId",
            table: "SchoolPaymentNotifications",
            column: "ProviderTransactionId",
            unique: true,
            filter: "\"ProviderTransactionId\" IS NOT NULL");

    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $
            BEGIN
                IF EXISTS (SELECT 1 FROM "PaymentAllocations")
                   OR EXISTS (SELECT 1 FROM "PaymentLedgerEntries")
                   OR EXISTS (SELECT 1 FROM "Payments" WHERE "ProviderTransactionId" IS NOT NULL OR "SourceChannel" IS NOT NULL)
                   OR EXISTS (SELECT 1 FROM "SchoolPaymentNotifications" WHERE "ProviderTransactionId" IS NOT NULL OR "ProviderStatus" IS NOT NULL) THEN
                    RAISE EXCEPTION 'Cannot revert payment integrity migration after allocation, ledger or provider metadata has been recorded.';
                END IF;
            END $;
            """);

        migrationBuilder.DropIndex(name: "IX_SchoolPaymentNotifications_ProviderTransactionId", table: "SchoolPaymentNotifications");
        migrationBuilder.DropTable(name: "PaymentLedgerEntries");
        migrationBuilder.DropTable(name: "PaymentAllocations");
        migrationBuilder.DropForeignKey(name: "FK_Payments_StudentInvoices_StudentInvoiceId", table: "Payments");
        migrationBuilder.DropIndex(name: "IX_Payments_ReceiptNumber", table: "Payments");
        migrationBuilder.DropIndex(name: "IX_Payments_ProviderTransactionId", table: "Payments");
        migrationBuilder.DropIndex(name: "IX_Payments_StudentInvoiceId_PaidAt", table: "Payments");

        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM "Payments" WHERE "StudentInvoiceId" IS NULL) THEN
                    RAISE EXCEPTION 'Cannot revert nullable Payments.StudentInvoiceId while unallocated payments exist.';
                END IF;
            END $$;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "StudentInvoiceId",
            table: "Payments",
            type: "uuid",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uuid",
            oldNullable: true);

        migrationBuilder.DropColumn(name: "SourceChannel", table: "Payments");
        migrationBuilder.DropColumn(name: "ProviderTransactionId", table: "Payments");
        migrationBuilder.DropColumn(name: "ProviderTransactionId", table: "SchoolPaymentNotifications");
        migrationBuilder.DropColumn(name: "ProviderStatus", table: "SchoolPaymentNotifications");
    }
}
