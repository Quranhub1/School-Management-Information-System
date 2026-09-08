using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260909100000_AddFinanceProductionHardening")]
public partial class AddFinanceProductionHardening : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
CREATE TABLE IF NOT EXISTS "AccountingDimensions" (
    "Id" uuid NOT NULL,
    "DimensionType" character varying(50) NOT NULL,
    "Code" character varying(80) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AccountingDimensions" PRIMARY KEY ("Id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_AccountingDimensions_DimensionType_Code" ON "AccountingDimensions" ("DimensionType", "Code");
CREATE TABLE IF NOT EXISTS "JournalLineDimensions" (
    "Id" uuid NOT NULL,
    "JournalEntryLineId" uuid NOT NULL,
    "AccountingDimensionId" uuid NOT NULL,
    CONSTRAINT "PK_JournalLineDimensions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_JournalLineDimensions_JournalEntryLines" FOREIGN KEY ("JournalEntryLineId") REFERENCES "JournalEntryLines" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_JournalLineDimensions_AccountingDimensions" FOREIGN KEY ("AccountingDimensionId") REFERENCES "AccountingDimensions" ("Id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_JournalLineDimensions_Line_Dimension" ON "JournalLineDimensions" ("JournalEntryLineId", "AccountingDimensionId");
CREATE TABLE IF NOT EXISTS "BankTransactions" (
    "Id" uuid NOT NULL,
    "BankAccountId" uuid NOT NULL,
    "TransactionDate" timestamp with time zone NOT NULL,
    "Reference" character varying(100) NOT NULL,
    "Description" character varying(500),
    "Amount" numeric NOT NULL,
    "IsCredit" boolean NOT NULL,
    "IsReconciled" boolean NOT NULL,
    "BankStatementLineId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_BankTransactions" PRIMARY KEY ("Id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_BankTransactions_BankStatementLineId" ON "BankTransactions" ("BankStatementLineId");
CREATE INDEX IF NOT EXISTS "IX_BankTransactions_BankAccountId_TransactionDate" ON "BankTransactions" ("BankAccountId", "TransactionDate");
CREATE TABLE IF NOT EXISTS "FinanceAuditEvents" (
    "Id" uuid NOT NULL,
    "OccurredAt" timestamp with time zone NOT NULL,
    "Action" character varying(100) NOT NULL,
    "EntityType" character varying(100) NOT NULL,
    "EntityId" uuid NOT NULL,
    "PerformedBy" character varying(200) NOT NULL,
    "Reason" character varying(1000),
    "SourceJournalEntryId" uuid,
    "Metadata" character varying(4000),
    CONSTRAINT "PK_FinanceAuditEvents" PRIMARY KEY ("Id")
);
CREATE INDEX IF NOT EXISTS "IX_FinanceAuditEvents_Entity" ON "FinanceAuditEvents" ("EntityType", "EntityId", "OccurredAt");
CREATE TABLE IF NOT EXISTS "OpeningBalances" (
    "Id" uuid NOT NULL,
    "FiscalPeriodId" uuid NOT NULL,
    "AccountId" uuid NOT NULL,
    "Debit" numeric NOT NULL,
    "Credit" numeric NOT NULL,
    "Currency" character varying(3) NOT NULL,
    "SourceReference" character varying(200),
    "CreatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_OpeningBalances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OpeningBalances_FiscalPeriods" FOREIGN KEY ("FiscalPeriodId") REFERENCES "FiscalPeriods" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_OpeningBalances_Accounts" FOREIGN KEY ("AccountId") REFERENCES "Accounts" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_OpeningBalances_OneSide" CHECK (("Debit" >= 0) AND ("Credit" >= 0) AND NOT ("Debit" > 0 AND "Credit" > 0) AND ("Debit" > 0 OR "Credit" > 0))
);
CREATE INDEX IF NOT EXISTS "IX_OpeningBalances_FiscalPeriod_Account" ON "OpeningBalances" ("FiscalPeriodId", "AccountId");
CREATE TABLE IF NOT EXISTS "AdjustmentCancellations" (
    "Id" uuid NOT NULL,
    "AdjustmentId" uuid NOT NULL,
    "Reason" character varying(1000) NOT NULL,
    "CancelledBy" character varying(200) NOT NULL,
    "CancelledAt" timestamp with time zone NOT NULL,
    "ReversalJournalEntryId" uuid,
    CONSTRAINT "PK_AdjustmentCancellations" PRIMARY KEY ("Id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_AdjustmentCancellations_AdjustmentId" ON "AdjustmentCancellations" ("AdjustmentId");
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"AdjustmentCancellations\"; DROP TABLE IF EXISTS \"OpeningBalances\"; DROP TABLE IF EXISTS \"FinanceAuditEvents\"; DROP TABLE IF EXISTS \"BankTransactions\"; DROP TABLE IF EXISTS \"JournalLineDimensions\"; DROP TABLE IF EXISTS \"AccountingDimensions\";");
    }
}
