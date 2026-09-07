using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

/// <summary>
/// Adds a PostgreSQL database boundary around posted journal history. The EF interceptor
/// remains useful for application-level feedback, while this trigger protects the ledger
/// even when rows are changed outside EF Core.
/// </summary>
[DbContext(typeof(SchoolManagement.Infrastructure.Persistence.SchoolManagementDbContext))]
[Migration("20260908120000_AddPostedJournalDatabaseImmutability")]
public partial class AddPostedJournalDatabaseImmutability : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION prevent_posted_journal_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    journal_id uuid;
BEGIN
    IF TG_TABLE_NAME = 'JournalEntries' THEN
        IF TG_OP IN ('UPDATE', 'DELETE')
           AND OLD.""Status"" = 'Posted' THEN
            RAISE EXCEPTION 'Posted journal entries are immutable. Create a reversal or adjustment journal instead.'
                USING ERRCODE = 'restrict_violation';
        END IF;
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    IF TG_TABLE_NAME = 'JournalEntryLines' THEN
        journal_id := CASE
            WHEN TG_OP = 'DELETE' THEN OLD.""JournalEntryId""
            ELSE NEW.""JournalEntryId""
        END;

        IF EXISTS (
            SELECT 1
            FROM ""JournalEntries"" je
            WHERE je.""Id"" = journal_id
              AND je.""Status"" = 'Posted'
        ) THEN
            RAISE EXCEPTION 'Lines belonging to a posted journal entry are immutable.'
                USING ERRCODE = 'restrict_violation';
        END IF;
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_journal_entries_immutable ON ""JournalEntries"";
CREATE TRIGGER trg_journal_entries_immutable
BEFORE UPDATE OR DELETE ON ""JournalEntries""
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_mutation();

DROP TRIGGER IF EXISTS trg_journal_entry_lines_immutable ON ""JournalEntryLines"";
CREATE TRIGGER trg_journal_entry_lines_immutable
BEFORE INSERT OR UPDATE OR DELETE ON ""JournalEntryLines""
FOR EACH ROW
EXECUTE FUNCTION prevent_posted_journal_mutation();
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
DROP TRIGGER IF EXISTS trg_journal_entry_lines_immutable ON ""JournalEntryLines"";
DROP TRIGGER IF EXISTS trg_journal_entries_immutable ON ""JournalEntries"";
DROP FUNCTION IF EXISTS prevent_posted_journal_mutation();
");
    }
}
