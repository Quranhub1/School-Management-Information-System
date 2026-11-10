using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261111220000_BackfillLegacyStudentPaymentLedger")]
public sealed class BackfillLegacyStudentPaymentLedger : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            -- Existing payments created before the allocation model had a required invoice link.
            -- Preserve those allocations without duplicating payments created after the ledger went live.
            INSERT INTO "PaymentAllocations"
                ("Id", "PaymentId", "StudentInvoiceId", "AllocatedAmount", "Currency", "AllocatedAt", "Notes")
            SELECT
                gen_random_uuid(),
                p."Id",
                p."StudentInvoiceId",
                p."Amount",
                p."Currency",
                p."PaidAt",
                'MIGRATION:20261111220000:PAYMENT-ALLOCATION'
            FROM "Payments" p
            WHERE p."StudentInvoiceId" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM "PaymentAllocations" a WHERE a."PaymentId" = p."Id"
              );

            -- Invoice and payment events created after the ledger was introduced already
            -- have ledger rows. Only backfill records that are still missing.
            INSERT INTO "PaymentLedgerEntries"
                ("Id", "StudentId", "StudentInvoiceId", "PaymentId", "PaymentAllocationId",
                 "EntryDate", "EntryType", "Description", "Amount", "Currency", "Reference")
            SELECT
                gen_random_uuid(),
                i."StudentId",
                i."Id",
                NULL,
                NULL,
                i."IssuedAt",
                'Invoice',
                'Invoice ' || i."InvoiceNumber",
                GREATEST(0, i."Amount" - i."DiscountAmount"),
                i."Currency",
                'MIGRATION:20261111220000:INVOICE:' || i."Id"::text
            FROM "StudentInvoices" i
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentLedgerEntries" e
                WHERE e."StudentInvoiceId" = i."Id" AND e."EntryType" = 'Invoice'
            );

            INSERT INTO "PaymentLedgerEntries"
                ("Id", "StudentId", "StudentInvoiceId", "PaymentId", "PaymentAllocationId",
                 "EntryDate", "EntryType", "Description", "Amount", "Currency", "Reference")
            SELECT
                gen_random_uuid(),
                p."StudentId",
                p."StudentInvoiceId",
                p."Id",
                NULL,
                p."PaidAt",
                'Payment',
                'Payment ' || p."ReceiptNumber",
                -p."Amount",
                p."Currency",
                'MIGRATION:20261111220000:PAYMENT:' || p."Id"::text
            FROM "Payments" p
            WHERE NOT EXISTS (
                SELECT 1 FROM "PaymentLedgerEntries" e
                WHERE e."PaymentId" = p."Id" AND e."EntryType" = 'Payment'
            );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM "PaymentLedgerEntries"
            WHERE "Reference" LIKE 'MIGRATION:20261111220000:%';

            DELETE FROM "PaymentAllocations"
            WHERE "Notes" = 'MIGRATION:20261111220000:PAYMENT-ALLOCATION';
            """);
    }
}
