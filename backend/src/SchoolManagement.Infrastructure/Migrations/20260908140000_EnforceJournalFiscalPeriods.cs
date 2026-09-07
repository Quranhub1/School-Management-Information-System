using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908140000_EnforceJournalFiscalPeriods")]
public partial class EnforceJournalFiscalPeriods : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE OR REPLACE FUNCTION validate_journal_fiscal_period()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            DECLARE
                transaction_date date;
                period_status text;
                period_name text;
                period_count integer;
            BEGIN
                IF COALESCE(NEW."Status", '') <> 'Posted' THEN
                    RETURN NEW;
                END IF;

                SELECT COUNT(*) INTO period_count FROM "FiscalPeriods";
                IF period_count = 0 THEN
                    RETURN NEW;
                END IF;

                transaction_date := (NEW."EntryDate" AT TIME ZONE 'UTC')::date;

                SELECT "Status", "Name"
                INTO period_status, period_name
                FROM "FiscalPeriods"
                WHERE "StartDate" <= transaction_date
                  AND "EndDate" >= transaction_date
                LIMIT 1;

                IF period_name IS NULL THEN
                    RAISE EXCEPTION 'No fiscal period contains journal transaction date %', transaction_date
                        USING ERRCODE = 'restrict_violation';
                END IF;

                IF lower(COALESCE(period_status, '')) <> 'open' THEN
                    RAISE EXCEPTION 'Fiscal period % is closed', period_name
                        USING ERRCODE = 'restrict_violation';
                END IF;

                RETURN NEW;
            END;
            $$;
            """);

        migrationBuilder.Sql("""
            DROP TRIGGER IF EXISTS trg_journal_entries_fiscal_period ON "JournalEntries";
            CREATE TRIGGER trg_journal_entries_fiscal_period
            BEFORE INSERT OR UPDATE OF "EntryDate", "Status"
            ON "JournalEntries"
            FOR EACH ROW
            EXECUTE FUNCTION validate_journal_fiscal_period();
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_journal_entries_fiscal_period ON \"JournalEntries\";");
        migrationBuilder.Sql("DROP FUNCTION IF EXISTS validate_journal_fiscal_period();");
    }
}
